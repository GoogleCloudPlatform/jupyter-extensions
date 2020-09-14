import { requestAPI } from './request_api';
import { GitSyncService } from './service';
import { ISignal, Signal } from '@lumino/signaling';

/**
 *
 * Class responsible for requesting git handlers on the server side
 * to synchronize local repository with remote repository
 *
 */

export class GitManager {
  // Member Fields
  private _path: string = undefined;
  private _branch: string = undefined;
  private _collab: boolean = true;
  private _executablePath: string = undefined;
  private _branches: string[] = [];

  private _setupChange: Signal<this, string> = new Signal<this, string>(this);

  constructor(){
    this._service = service;
    this.setup('.');
  }

  get path(): string {
    return this._path;
  }

  get branch(): string {
    return this._branch;
  }

  get collab(): boolean {
    return this._collab;
  }

  set collab(collab: boolean) {
    this._collab = collab;
  }

  get options(): string[] {
    return (this.collab) ? ['origin', 'jp-shared/'+this.branch] : []
  }

  get branches(): string[] {
    return this._branches;
  }

  get setupChange(): ISignal<this, string> {
    return this._setupChange;
  }

  async changeBranch(branch: string) {
    const create = (branch in this.branches);
    this._setupChange.emit('start');
    if (this.path && this._executablePath){
      const init: RequestInit = {
        method: 'POST',
        body: JSON.stringify({
          path: this._path,
          branch: branch, 
          create: create
        }),
      };

      const response = await requestAPI('v1/branch', init);

      if (response.success) {
        this._branch = branch
        if (create) this._branches.push(branch);
        this._setupChange.emit('finish');
      } else {
        this._setupChange.emit('finish');
        throw Error(response.error);
      }
    }
  }

  async sync() {
    if (this.path && this._executablePath){
      const init: RequestInit = {
        method: 'POST',
        body: JSON.stringify({
          path: this._path,
          collab: this.collab,
        }),
      };

      const response = await requestAPI('v1/sync', init);

      if (response.success) {
        if (response.curr_branch !== this.branch){
          this._branch = response.curr_branch;
          this._setupChange.emit('change');
        }
      } else {
        throw Error(response.error);
      }
    }
  }

  async setup(path: string) {
    console.log('start setup');
    this._setupChange.emit('start');
    this._path = undefined;

    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify({ path: path }),
    };

    const response = await requestAPI('v1/setup', init);
    if (response.repo_path) {
      this._path = response.repo_path;
      this._branches = response.branches;
      this._branch = response.curr_branch;
      this._setupChange.emit('finish');
    } else {
      this._setupChange.emit('finish');
      throw Error(response.error);
    }
    console.log(this.path, this.branch, this.branches, this.options);
  }

}
