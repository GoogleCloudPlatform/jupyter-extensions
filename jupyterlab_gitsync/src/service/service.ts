import { FileTracker } from './tracker';
import { GitManager } from './git';

/**
 *
 * Class in charge of calling necessary functions from
 * the GitManager and FileTracker classes
 *
 */

export class GitSyncService {
  /* Member Fields */
  private _git: GitManager;
  private _files: FileTracker;
  private _editor;
  private _isRunning: boolean;
  syncInterval: number = 20 * 1000;

  constructor(git: GitManager, files: FileTracker, editor) {
    this._git = git;
    this._files = files;
    this._editor = editor;
    this._addListeners();
  }

  start() {
    console.log('start git sync service');
    this._isRunning = true;
    this._run();
  }

  stop() {
    this._isRunning = false;
    console.log('stop git sync service');
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get git(): GitManager {
    return this._git;
  }

  get files(): FileTracker {
    return this._files;
  }

  get editor() {
    return this._editor;
  }

  private async _run() {
    setTimeout(() => {
      this.files.saveAll();
    }, 5000);
  }

  private _resolveConflicts() {
    // this._conflict = true;
    this.stop();
    // this._git.sync();
  }

  private _addListeners() {
    this.files.saveCompleted.connect(() => {
      if (this.isRunning) {
        this.git.sync();
      }
    }, this);

    this.git.mergeConflict.connect(() => {
      this._resolveConflicts();
    }, this);

    this.git.syncCompleted.connect(() => {
      if (this.isRunning) {
        this.files.reloadAll();
      }
    }, this);

    this.files.reloadCompleted.connect(() => {
      if (this.isRunning) {
        this.files.saveAll();
      }
    }, this);
  }
}
