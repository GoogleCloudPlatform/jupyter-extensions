import { CodeMirror } from 'codemirror';
// import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
// import { default as merge } from 'diff3';

import { IFile, IResolver } from './tracker';
import { NotebookFile } from './notebook_file';

function token() {
  let token = '';
  while (token.length < 32)
    token += Math.random()
      .toString(36)
      .substr(2);
  return '/$*' + token + '*$/';
}

// TO DO (ashleyswang): implement most functionality for NotebookResolver
// mostly a placeholder file with outline of needed functions
// so compiler doesn't complain

export class NotebookResolver implements IResolver {
  _file: IFile;
  _token: string = token();
  _cursor: CodeMirror.Pos;

  private _conflict: boolean;
  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(file: NotebookFile) {
    this._file = file;
  }

  get file(): IFile {
    return this._file;
  }

  get path(): string {
    return this._file.path;
  }

  get conflict(): boolean {
    return this._conflict;
  }

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
  }

  addVersion(text: string, origin: 'base' | 'local' | 'remote'): void {
    return;
  }

  async mergeVersions(): Promise<string> {
    return '';
  }

}
