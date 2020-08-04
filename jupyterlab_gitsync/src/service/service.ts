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
  private _completed: boolean = true;
  private _running: boolean;
  syncInterval: number = 0 * 1000;

  private _blocked: boolean = false;
  private _stateChange: Signal<this, boolean> = new Signal<this, boolean>(this);
  private _statusChange: Signal<this, string> = new Signal<this, string>(this);

  constructor(git: GitManager, tracker: FileTracker) {
    this._git = git;
    this._tracker = tracker;
    this._addListeners();
  }

  start() {
    if (!this._blocked && !this.running){
      console.log('start git sync service');
      this._running = true;
      this._run();
      this._stateChange.emit(this.running);
    }
  }

  stop() {
    if (!this._blocked && this.running){
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

  get stateChange(): ISignal<this, boolean> {
    return this._stateChange;
  }

  get statusChange(): ISignal<this, string> {
    return this._statusChange;
  }

  private async _run(): Promise<void> {
    if (this.running && this.completed){
      this._completed = false;
      setTimeout(async () => {
        try{
          await this.tracker.saveAll();
          this._statusChange.emit('sync');
          await this.git.sync();
          this._statusChange.emit('merge');
          await this.tracker.reloadAll();
          this._statusChange.emit('up-to-date');
        } catch (error) {
          console.warn(error);
          this._statusChange.emit('warning')
        }
        this._completed = true; 
        this._run();
      }, this.syncInterval);
    }
  }

  private _addListeners(): void {
    this.tracker.stateChange.connect((tracker, resolved) => {
      if (resolved && !this.running){
        this._blocked = false;
        this.start();
      } else if (!resolved && this.running){
        this.stop();
        this._blocked = true;
      }
    }, this);
  }
}
