import { IEditorTracker } from '@jupyterlab/fileeditor';
import { ISignal, Signal } from '@lumino/signaling';
import { IDocumentWidget, DocumentModel } from '@jupyterlab/docregistry';
import { ILabShell } from '@jupyterlab/application';
import { FileEditor } from '@jupyterlab/fileeditor';

import { File } from './file';
import { MergeResolver } from './resolver';

export class FileTracker {
  /* Member Fields */
  shell: ILabShell
  editor: IEditorTracker;
  current: File;
  opened: File[] = [];
  conflicts: File[] = [];
  resolved: boolean;

  private _saveCompleted: Signal<this, void> = new Signal<this, void>(this);
  private _reloadCompleted: Signal<this, void> = new Signal<this, void>(this);
  private _stateChange: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(editor: IEditorTracker, shell: ILabShell) {
    this.editor = editor;
    this.shell = shell;
    this._addListeners();
  }

  get saveCompleted(): ISignal<this, void> {
    return this._saveCompleted;
  }

  get reloadCompleted(): ISignal<this, void> {
    return this._reloadCompleted;
  }

  get stateChange(): ISignal<this, boolean> {
    return this._stateChange;
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

  private _addListeners() {
    this.shell.currentChanged.connect(this._updateCurrent, this);
  }

  private _updateCurrent() {
    const current = this.editor.currentWidget;
    if (current) this._updateFiles(current);
    // console.log('editor', this.editor.currentWidget);
    // console.log('shell', this.shell.currentWidget);
  }

  private _updateFiles(widget: IDocumentWidget) {
    let createFile = true;

    this.opened.forEach(file => {
      if (createFile && file.context.path === widget.context.path) {
        this.current = file;
        createFile = false;
      }
    });

    if (createFile) {
      const file = new File(widget);
      this.current = file;
      this.opened.push(file);
      this._addFileListener(file.widget.disposed, this._disposedListener);
      this._addFileListener(file.resolver.stateChange, this._conflictListener);
      this._addFileListener(((file.widget.content as FileEditor)
        .model as DocumentModel).stateChanged, this._dirtyStateListener);
    } 
  }

  private _addFileListener(signal: ISignal<any, any>, callback: any){
    return signal.connect(callback, this);
  }

  private _removeFileListener(signal: ISignal<any, any>, callback: any){
    return signal.disconnect(callback, this);
  }

  private _disposedListener(sender: IDocumentWidget){
    const file = this.opened.find(file => file.widget === sender);
    const i = this.opened.indexOf(file);
    this.opened.splice(i, 1);

    this._removeFileListener(file.resolver.stateChange, this._conflictListener);
    this._removeFileListener(((file.widget.content as FileEditor)
      .model as DocumentModel).stateChanged, this._dirtyStateListener);
  }

  private _conflictListener(sender: MergeResolver, resolved: boolean){
    if (resolved){
      const i = this.conflicts.indexOf(sender.file);
      this.conflicts.splice(i, 1);
      if (this.conflicts.length == 0){
        this.resolved = true;
        this._stateChange.emit(this.resolved);
      }
    } else {
      this.conflicts.push(sender.file);
      this.resolved = false;
      this._stateChange.emit(this.resolved);
    }
  }

  private _dirtyStateListener(sender: DocumentModel, args: any){
    console.log(sender, args);
  }
}
