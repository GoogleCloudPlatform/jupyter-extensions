import { requestAPI } from './request_api';
import { ISignal, Signal } from '@lumino/signaling';

/**
 *
 * Class responsible for requesting git handlers on the server side
 * to synchronize local repository with remote repository
 *
 */

export class GitManager {
  // Member Fields
  private _path: string;
  private _executablePath: string;
  private _options: string[] = [];
  private _fileConflicts: string[] = undefined;
  private _syncCompleted: Signal<this, void> = new Signal<this, void>(this);
  private _mergeConflict: Signal<this, void> = new Signal<this, void>(this);

  constructor(path: string, options?: {remote: string, worktree:string}) {
    this._setup(path);
    if (options){
      this._options[0] = options.remote;
      this._options[1] = options.worktree;
    }
  }

  get path(): string {
    return this._path;
  }

  get fileConflicts(): string[] {
    return this._fileConflicts;
  }

  get syncCompleted(): ISignal<this, void> {
    return this._syncCompleted;
  }

  get mergeConflict(): ISignal<this, void> {
    return this._mergeConflict;
  }

  async sync(args: string = null, emit = true) {
    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        path: this._path,
        ex_path: this._executablePath,
        options: this._options,
      }),
    };

    const response = await requestAPI('v1/sync', init);

    if (response.success) {
      return this._syncCompleted.emit();
    } else if (response.conflict) {
      // TO DO (ashleyswang): add logic for resolving conflicts during sync
      // this._fileConflicts = response.conflict;
      return this._mergeConflict.emit();
    } else {
      throw Error(response.error);
    }
  }

  private async _setup(path: string) {
    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify({ path: path }),
    };

    const response = await requestAPI('v1/setup', init);
    if (response.ex_path) {
      this._path = path;
      this._executablePath = response.ex_path;
    } else {
      throw Error(response.error);
    }
  }
}
