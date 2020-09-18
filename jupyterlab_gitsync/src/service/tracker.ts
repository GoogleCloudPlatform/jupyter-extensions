import { ILabShell } from '@jupyterlab/application';
import { ISignal, Signal } from '@lumino/signaling';
import {
  IDocumentWidget,
  DocumentWidget,
  DocumentRegistry,
} from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';

import { GitSyncService } from './service';
import { TextFile } from './text_file';
import { NotebookFile } from './notebook_file';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IResolver {
  file: IFile;
  path: string;
  conflict: boolean;

  addVersion(content: any, origin: string): void;
  mergeVersions(): any;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IFile {
  widget: IDocumentWidget;
  context: DocumentRegistry.Context;
  path: string;
  mergeState: ISignal<this, string>;
  dirtyState: ISignal<this, boolean>;
  resolver: IResolver;
  repoPath: string;

  save(): Promise<void>;
  viewDiff(): Promise<void>;
  reveal(): Promise<void>;
  markResolved(): Promise<void>;
  reload(): Promise<IFile>;
}

export class FileTracker {
  /* Member Fields */
  service: GitSyncService;
  shell: ILabShell;
  current: IFile;
  opened: IFile[] = [];
  conflicts: IFile[] = [];
  dirty: IFile[] = [];

  conflict: boolean;
  isDirty: boolean;

  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(
    this
  );
  private _dirtyState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(service: GitSyncService) {
    this.service = service;
    this.shell = this.service.shell;
    this._addListener(this.shell.currentChanged, this._updateCurrent);
  }

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
  }

  get dirtyState(): ISignal<this, boolean> {
    return this._dirtyState;
  }

  async saveAll() {
    const promises = this.opened.map(file => {
      return file.save();
    });
    await Promise.all(promises);
  }

  async reloadAll() {
    const promises = this.opened.map(file => {
      return file.reload();
    });

    const fulfilled = (await Promise.all(promises)).filter(
      x => x !== undefined
    );
    if (fulfilled.length) {
      this.conflicts = fulfilled;
      this._updateState('conflict', true);
    }
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _removeListener(signal: ISignal<any, any>, callback: any) {
    return signal.disconnect(callback, this);
  }

  private _updateState(type: 'conflict' | 'dirty', state: boolean) {
    const curr = type === 'conflict' ? this.conflict : this.isDirty;
    const signal = type === 'conflict' ? this._conflictState : this._dirtyState;

    if (state !== curr) {
      if (type === 'conflict') {
        this.conflict = state;
      }
      if (type === 'dirty') {
        this.isDirty = state;
      }
      signal.emit(state);
    }
  }

  private _updateCurrent() {
    const current = this.shell.currentWidget;
    if (current instanceof DocumentWidget) {
      this._updateFiles(current);
      this.service.setup(this.current);
    }
  }

  private _updateFiles(widget: DocumentWidget) {
    let file = this.opened.find(file => file.path === widget.context.path);
    if (file) this.current = file;
    else {
      file =
        widget instanceof NotebookPanel
          ? new NotebookFile(widget, this.service.manager)
          : new TextFile(widget, this.service.manager);
      this.current = file;
      this.opened.push(file);

      this._addListener(file.widget.disposed, this._disposedListener);
      this._addListener(file.mergeState, this._conflictListener);
      this._addListener(file.dirtyState, this._dirtyStateListener);
    }
  }

  private _disposedListener(sender: IDocumentWidget) {
    const file = this.opened.find(file => file.widget === sender);
    const i = this.opened.indexOf(file);
    this.opened.splice(i, 1);

    this._removeListener(file.mergeState, this._conflictListener);
    this._removeListener(file.dirtyState, this._dirtyStateListener);
  }

  private _conflictListener(sender: IFile, state: string) {
    if (state === 'resolved') {
      const i = this.conflicts.indexOf(sender);
      this.conflicts.splice(i, 1);
      if (this.conflicts.length === 0) {
        this._updateState('conflict', false);
      }
    }
  }

  private _dirtyStateListener(sender: IFile, dirty: boolean) {
    if (!dirty) {
      const i = this.dirty.indexOf(sender);
      this.dirty.splice(i, 1);
      if (this.dirty.length === 0) {
        this._updateState('dirty', false);
      }
    } else {
      this.dirty.push(sender);
      this._updateState('dirty', true);
    }
  }
}
