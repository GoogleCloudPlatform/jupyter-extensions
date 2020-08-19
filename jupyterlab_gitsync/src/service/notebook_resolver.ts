import { CodeMirror } from 'codemirror';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { requestAPI } from './request_api';

import { IResolver } from './tracker';
import { NotebookFile } from './notebook_file';

function token() {
  let token = '';
  while (token.length < 32)
    token += Math.random()
      .toString(36)
      .substr(2);
  return '/$*' + token + '*$/';
}

interface Versions {
  base: string;
  local: string;
  remote: string;
}

export class NotebookResolver implements IResolver {
  _file: NotebookFile;
  _token: string = token();
  _cursor: CodeMirror.Pos;
  _fpath: string;
  _dpath: string;

  private _versions: Versions = {
    base: undefined,
    local: undefined,
    remote: undefined,
  };

  private _conflict: boolean;
  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(file: NotebookFile) {
    this._file = file;
  }

  get file(): NotebookFile {
    return this._file;
  }

  get path(): string {
    return this._file.path;
  }

  get conflict(): boolean {
    return this._conflict;
  }

  get versions(): Versions {
    return this._versions;
  }

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
  }

  addVersion(text: string, origin: 'base' | 'local' | 'remote'): void {
    this._versions[origin] = text;
  }

  async sendInitRequest(): Promise<any> {
    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        path: this.file.git_path,
        file_path: this.path,
      }),
    };

    const response = await requestAPI('v1/nbinit', init);
    if (response.success){
      this._fpath = response.fpath;
      this._dpath = response.dpath;
    } else {
      throw Error(response.error);
    }
  }

  async mergeVersions(): Promise<any> {
    const response = await this._sendMergeRequest();

    if (response.success) { return true; }
    else if (response.conflict) { await this._resolveConflicts(); } 
    else { throw Error(response.error); }
  }

  private async _sendMergeRequest() {
    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        path: this.file.git_path,
        fpath: this._fpath,
        dpath: this._dpath,
        text: this.versions.local
      }),
    };

    const response = await requestAPI('v1/nbmerge', init);
    return response;
  }

  private async _resolveConflicts() {
    // TO DO (ashleyswang): add 3 way merge conflict functionality
    await this._resolveDialog();
  }

  private _updateState(state: boolean){
    if (state != this.conflict){
      this._conflict = state;
      this._conflictState.emit(state);
    }
  }

  private async _sendResolveRequest(origin: 'local' | 'remote' | 'merged'){
    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        path: this.file.git_path,
        fpath: this._fpath,
        dpath: this._dpath,
        origin: origin
      }),
    };

    const response = await requestAPI('v1/nbresolve', init);
    if (response.success){ return; }
    else{ throw Error(response.error); }
  }

  private async _resolveDialog(): Promise<void> {
    const body = 
      `"${this.path}" has a conflict. Would you like to revert to a previous version?\
      \n(Note that ignoring conflicts will stop git sync.)`;
    // const resolveBtn = Dialog.okButton({ label: 'Resolve Conflicts' });
    const localBtn = Dialog.okButton({ label: 'Revert to Local' });
    const remoteBtn = Dialog.okButton({ label: 'Revert to Remote' });
    const diffBtn = Dialog.okButton({ label: 'View Merged'})
    const ignoreBtn = Dialog.warnButton({ label: 'Ignore Conflict' })
    return showDialog({
      title: 'Merge Conflicts',
      body,
      buttons: [ignoreBtn, remoteBtn, localBtn, diffBtn],
    }).then(async result => {
      if (result.button.label === 'Revert to Local') {
        await this._sendResolveRequest('local');
      }
      if (result.button.label === 'Revert to Remote') {
        await this._sendResolveRequest('remote')
      } 
      if (result.button.label === 'View Merged') {
        await this._sendResolveRequest('merged')
      }
      if (result.button.label === 'Resolve Conflicts') {
        // TO DO (ashleyswang) : open an editor for 3 way merging
      }
      if (result.button.label === 'Ignore') {
        this._updateState(true);
        throw new Error('ConflictError: Unresolved conflicts in repository. Stopping sync procedure.');
      }
    });
  }
}

