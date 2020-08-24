/* eslint-disable @typescript-eslint/interface-name-prefix */
import { ILabShell } from '@jupyterlab/application';
import { ISignal, Signal } from '@lumino/signaling';
import {
  IDocumentWidget,
  DocumentWidget,
  DocumentRegistry,
} from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';

import { File } from './file';
import { NotebookFile } from './notebook_file';

export interface IResolver {
  file: IFile;
  path: string;
  conflict: boolean;
  conflictState: ISignal<this, boolean>;

  addVersion(text: string, origin: string): void;
  mergeVersions(): Promise<any>;
}

export interface IFile {
  widget: IDocumentWidget;
  context: DocumentRegistry.Context;
  path: string;
  conflictState: ISignal<this, boolean>;
  dirtyState: ISignal<this, boolean>;
  resolver: IResolver;

  save(): Promise<void>;
  reload(): Promise<void>;
}

export class FileTracker {
  /* Member Fields */
  shell: ILabShell;
  current: IFile;
  opened: IFile[] = [];
  conflicts: IFile[] = [];
  changed: IFile[] = [];

  conflict: boolean;
  dirty: boolean;

  private _saveCompleted: Signal<this, void> = new Signal<this, void>(this);
  private _reloadCompleted: Signal<this, void> = new Signal<this, void>(this);
  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(
    this
  );
  private _dirtyState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(shell: ILabShell) {
    this.shell = shell;
    this._addListener(this.shell.currentChanged, this._updateCurrent);
  }

  get saveCompleted(): ISignal<this, void> {
    return this._saveCompleted;
  }

  get reloadCompleted(): ISignal<this, void> {
    return this._reloadCompleted;
  }

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
  }

  get dirtyState(): ISignal<this, boolean> {
    return this._dirtyState;
  }

  async saveAll() {
    const promises = this.opened.map(async file => {
      return await file.save();
    });
    await Promise.all(promises);
    return this._saveCompleted.emit();
  }

  async reloadAll() {
    const promises = this.opened.map(async file => {
      return await file.reload();
    });
    await Promise.all(promises);
    return this._reloadCompleted.emit();
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _removeListener(signal: ISignal<any, any>, callback: any) {
    return signal.disconnect(callback, this);
  }

  private _updateState(type: 'conflict' | 'dirty', state: boolean) {
    const curr = type === 'conflict' ? this.conflict : this.dirty;
    const signal = type === 'conflict' ? this._conflictState : this._dirtyState;

    if (state !== curr) {
      if (type === 'conflict') {
        this.conflict = state;
      }
      if (type === 'dirty') {
        this.dirty = state;
      }
      signal.emit(state);
    }
  }

  private _updateCurrent() {
    const current = this.shell.currentWidget;
    if (current instanceof DocumentWidget) {
      this._updateFiles(current);
    }
  }

  private _updateFiles(widget: DocumentWidget) {
    let file = this.opened.find(file => file.path === widget.context.path);
    if (file) this.current = file;
    else {
      file =
        widget instanceof NotebookPanel
          ? new NotebookFile(widget)
          : new File(widget);
      this.current = file;
      this.opened.push(file);

      this._addListener(file.widget.disposed, this._disposedListener);
      this._addListener(file.conflictState, this._conflictListener);
      this._addListener(file.dirtyState, this._dirtyStateListener);
    }
  }

  private _disposedListener(sender: IDocumentWidget) {
    const file = this.opened.find(file => file.widget === sender);
    const i = this.opened.indexOf(file);
    this.opened.splice(i, 1);

    this._removeListener(file.conflictState, this._conflictListener);
    this._removeListener(file.dirtyState, this._dirtyStateListener);
  }

  private _conflictListener(sender: File, conflict: boolean) {
    if (!conflict) {
      const i = this.conflicts.indexOf(sender);
      this.conflicts.splice(i, 1);
      if (this.conflicts.length === 0) {
        this._updateState('conflict', false);
      }
    } else {
      this.conflicts.push(sender);
      this._updateState('conflict', true);
    }
  }

  private _dirtyStateListener(sender: File, dirty: boolean) {
    if (!dirty) {
      const i = this.changed.indexOf(sender);
      this.changed.splice(i, 1);
      if (this.changed.length === 0) {
        this._updateState('dirty', false);
      }
    } else {
      this.changed.push(sender);
      this._updateState('dirty', true);
    }
  }
}
