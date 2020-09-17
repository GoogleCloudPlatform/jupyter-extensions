import { ILabShell } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ISignal, Signal } from '@lumino/signaling';
import { FileTracker, IFile } from './tracker';
import { GitManager } from './git';

/**
 *
 * Class in charge of calling necessary functions from
 * the GitManager and FileTracker classes
 *
 */

export class GitSyncService {
  /* Member Fields */
  private _shell: ILabShell;
  private _manager: IDocumentManager;
  private _git: GitManager;
  private _tracker: FileTracker;
  private _completed = true;
  private _running: boolean;
  syncInterval: number = 10 * 1000;

  private _status: 'sync' | 'merge' | 'up-to-date' | 'dirty' | 'warning' =
    'up-to-date';
  private _blocked = false;
  private _blockedChange: Signal<this, boolean> = new Signal<this, boolean>(
    this
  );
  private _runningChange: Signal<this, boolean> = new Signal<this, boolean>(
    this
  );
  private _statusChange: Signal<this, any> = new Signal<this, any>(this);
  private _setupChange: Signal<this, any> = new Signal<this, any>(this);

  constructor(shell: ILabShell, manager: IDocumentManager) {
    this._shell = shell;
    this._manager = manager;
    this._git = new GitManager();
    this._tracker = new FileTracker(this);
    this._addListeners();
  }

  get running(): boolean {
    return this._running;
  }

  get completed(): boolean {
    return this._completed;
  }

  get shell(): ILabShell {
    return this._shell;
  }

  get manager(): IDocumentManager {
    return this._manager;
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

  get blockedChange(): ISignal<this, boolean> {
    return this._blockedChange;
  }

  get runningChange(): ISignal<this, boolean> {
    return this._runningChange;
  }

  get statusChange(): ISignal<this, any> {
    return this._statusChange;
  }

  get setupChange(): ISignal<this, any> {
    return this._setupChange;
  }

  start() {
    if (!this._blocked && !this.running) {
      console.log('start git sync service');
      this._running = true;
      this._run();
      this._runningChange.emit(this.running);
    }
  }

  stop() {
    if (!this._blocked && this.running) {
      this._running = false;
      this._runningChange.emit(this.running);
      console.log('stop git sync service');
    }
  }

  async setup(file?: IFile, branch?: string) {
    try {
      if (file && (!file.repoPath || file.repoPath !== this.git.path)) {
        const oldRepoPath = this.git.path;
        const path = file.repoPath
          ? file.repoPath
          : file.path.substring(0, file.path.lastIndexOf('/'));
        await this.git.setup(path);
        if (!file.repoPath) file.repoPath = this.git.path;
        if (oldRepoPath !== this.git.path) {
          const repoPath = this.git.path.substring(
            this.git.path.lastIndexOf('/') + 1
          );
          this._setupChange.emit({
            status: 'success',
            attrib: 'path',
            value: [
              'Changed repository path to ',
              repoPath,
              '. Current checked-out branch is ',
              this.git.branch,
              '.',
            ],
          });
        }
      }
      if (branch && branch !== this.git.branch) {
        await this.git.changeBranch(branch);
        this._setupChange.emit({
          status: 'success',
          attrib: 'branch',
          value: ['Checked-out to branch ', this.git.branch, '.'],
        });
      }
    } catch (error) {
      this._setupChange.emit({ status: 'error', value: error.toString() });
    }
  }

  async sync(): Promise<void> {
    try {
      await this.tracker.saveAll();
      this._updateStatus('sync');
      await this.git.sync();
      this._updateStatus('merge');
      await this.tracker.reloadAll();
      this._updateStatus('up-to-date');
    } catch (error) {
      console.warn(error);
      this._updateStatus('warning', error.toString());
    }
  }

  private async _run(): Promise<void> {
    if (this.running && this.completed && !this._blocked) {
      this._completed = false;
      setTimeout(async () => {
        await this.sync();
        this._completed = true;
        this._run();
      }, this.syncInterval);
    }
  }

  private _updateBlocked(blocked: boolean) {
    if (blocked !== this._blocked) {
      this._blocked = blocked;
      this._blockedChange.emit(this._blocked);
    }
  }

  private _updateStatus(
    status: 'sync' | 'merge' | 'up-to-date' | 'dirty' | 'warning',
    error?: string
  ) {
    if (status !== this.status) {
      this._status = status;
      this._statusChange.emit({
        status: status,
        error: error,
      });
    }
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _conflictListener(sender: FileTracker, conflict: boolean) {
    this._updateBlocked(conflict);
    if (this.running) this._runningChange.emit(!conflict);
    console.log('conflict update from service');
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
