import { FileTracker } from './tracker';
import { GitManager } from './git';
import { ISignal, Signal } from '@lumino/signaling';

/**
 *
 * Class in charge of calling necessary functions from
 * the GitManager and FileTracker classes
 *
 */

export class GitSyncService {
  /* Member Fields */
  private _git: GitManager;
  private _tracker: FileTracker;
  private _completed = true;
  private _running: boolean;
  syncInterval: number = 10 * 1000;

  private _status: 'sync' | 'merge' | 'up-to-date' | 'dirty' | 'warning';
  private _blocked = false;
  private _stateChange: Signal<this, boolean> = new Signal<this, boolean>(this);
  private _statusChange: Signal<this, string> = new Signal<this, string>(this);

  constructor(git: GitManager, tracker: FileTracker) {
    this._git = git;
    this._tracker = tracker;
    this._addListeners();
  }

  start() {
    if (!this._blocked && !this.running) {
      console.log('start git sync service');
      this._running = true;
      this._run();
      this._stateChange.emit(this.running);
    }
  }

  stop() {
    if (!this._blocked && this.running) {
      this._running = false;
      this._stateChange.emit(this.running);
      console.log('stop git sync service');
    }
  }

  get running(): boolean {
    return this._running;
  }

  get completed(): boolean {
    return this._completed;
  }

  get git(): GitManager {
    return this._git;
  }

  get tracker(): FileTracker {
    return this._tracker;
  }

  get status(): string {
    return this._status;
  }

  get stateChange(): ISignal<this, boolean> {
    return this._stateChange;
  }

  get statusChange(): ISignal<this, string> {
    return this._statusChange;
  }

  private _updateStatus(
    status: 'sync' | 'merge' | 'up-to-date' | 'dirty' | 'warning'
  ) {
    if (status !== this.status) {
      this._status = status;
      this._statusChange.emit(status);
    }
  }

  private async _run(): Promise<void> {
    if (this.running && this.completed) {
      this._completed = false;
      setTimeout(async () => {
        try {
          await this.tracker.saveAll();
          this._updateStatus('sync');
          await this.git.sync();
          this._updateStatus('merge');
          await this.tracker.reloadAll();
          this._updateStatus('up-to-date');
        } catch (error) {
          console.warn(error);
          this._updateStatus('warning');
        }
        this._completed = true;
        this._run();
      }, this.syncInterval);
    }
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _conflictListener(sender: FileTracker, conflict: boolean) {
    if (!conflict && !this.running) {
      this._blocked = false;
      this.start();
    } else if (conflict && this.running) {
      this.stop();
      this._blocked = true;
    }
  }

  private _dirtyStateListener(sender: FileTracker, dirty: boolean) {
    if (this.status === 'up-to-date' && dirty) {
      this._updateStatus('dirty');
    }
  }

  private _addListeners(): void {
    this._addListener(this.tracker.conflictState, this._conflictListener);
    this._addListener(this.tracker.dirtyState, this._dirtyStateListener);
  }
}
