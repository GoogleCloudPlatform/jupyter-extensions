import { IEditorTracker } from '@jupyterlab/fileeditor';
import { ISignal, Signal } from '@lumino/signaling';
import { IDocumentWidget } from '@jupyterlab/docregistry';

import { File } from './file';

export class FileTracker {
  /* Member Fields */
  editor: IEditorTracker;
  current: File;
  opened: File[] = [];

  private _saveCompleted: Signal<this, void> = new Signal<this, void>(this);
  private _reloadCompleted: Signal<this, void> = new Signal<this, void>(this);

  constructor(editor: IEditorTracker) {
    this.editor = editor;
    this._addListeners();
  }

  get saveCompleted(): ISignal<this, void> {
    return this._saveCompleted;
  }

  get reloadCompleted(): ISignal<this, void> {
    return this._reloadCompleted;
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
    this.editor.currentChanged.connect(this._updateCurrent, this);
  }

  private _updateCurrent() {
    const current = this.editor.currentWidget;
    if (current) this._updateFiles(current);
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
      file.widget.disposed.connect(() => {
        const i = this.opened.indexOf(file);
        this.opened.splice(i, 1);
      }, this);
    } else {
      this.current.reload();
    }
  }
}
