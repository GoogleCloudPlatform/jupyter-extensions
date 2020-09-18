import {
  DocumentWidget,
  DocumentRegistry,
  DocumentModel,
} from '@jupyterlab/docregistry';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ISignal, Signal } from '@lumino/signaling';
import { ContentsManager, Contents } from '@jupyterlab/services';

import { FileEditor } from '@jupyterlab/fileeditor';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeMirror } from 'codemirror';

import { IFile } from './tracker';
import { TextResolver } from './text_resolver';

const fs = new ContentsManager();

export class TextFile implements IFile {
  manager: IDocumentManager;
  widget: DocumentWidget;
  resolver: TextResolver;
  view: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  cursor: {
    line: number;
    ch: number;
  };
  repoPath: string = undefined;

  private _mergeState: Signal<this, string> = new Signal<this, string>(this);
  private _dirtyState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(widget: DocumentWidget, manager: IDocumentManager) {
    this.manager = manager;
    this.widget = widget;
    this.resolver = new TextResolver(this);

    this._getInitVersion();
    this._addListeners();
  }

  get path(): string {
    return this.widget.context.path;
  }

  get content(): FileEditor {
    return this.widget.content as FileEditor;
  }

  get context(): DocumentRegistry.Context {
    return this.widget.context;
  }

  get editor(): CodeMirror {
    return (this.content.editor as CodeMirrorEditor).editor;
  }

  get mergeState(): ISignal<this, string> {
    return this._mergeState;
  }

  get dirtyState(): ISignal<this, boolean> {
    return this._dirtyState;
  }

  async save(): Promise<void> {
    try {
      await this.context.save();
      const text = this.editor.getValue();
      this.resolver.addVersion(text, 'base');
    } catch (error) {
      console.warn(error);
    }
  }

  async viewDiff(): Promise<void> {
    this.widget = this.manager.openOrReveal(this.path) as DocumentWidget;
    await this.context.ready;
    const text = this.resolver.versions.merged;
    this.editor.setValue(text);
  }

  async reveal(): Promise<void> {
    this.widget = this.manager.openOrReveal(this.path) as DocumentWidget;
    await this.context.ready;
  }

  async markResolved(): Promise<void> {
    await this.save();
    this._mergeState.emit('resolved');
  }

  async reload(): Promise<TextFile> {
    await this._getRemoteVersion();
    this._getLocalVersion();
    this._getEditorView();
    const text = this.resolver.mergeVersions();
    if (text) await this._displayText(text);
    else await this._revertDisk();
    (this.content.model as DocumentModel).dirty = false;
    return this.resolver.conflict ? this : undefined;
  }

  private async _displayText(text: string): Promise<void> {
    await this._saveFile(text);
    await this.context.revert();
    this.cursor = this.resolver.getCursorToken();
    this._setEditorView();
  }

  private async _revertDisk(): Promise<void> {
    await this._saveFile(this.resolver.versions.local);
    await this.context.revert();
    this._setEditorView();
  }

  private async _saveFile(text: string): Promise<void> {
    const options = {
      content: text,
      format: 'text' as Contents.FileFormat,
      path: this.path,
      type: 'file' as Contents.ContentType,
    };
    await fs.save(this.path, options);
  }

  private async _getInitVersion(): Promise<void> {
    const contents = await fs.get(this.path);
    this.resolver.addVersion(contents.content, 'base');
    this.resolver.addVersion(contents.content, 'remote');
    this.resolver.addVersion(contents.content, 'local');
  }

  private async _getRemoteVersion(): Promise<void> {
    try {
      const contents = await fs.get(this.path);
      this.resolver.addVersion(contents.content, 'remote');
    } catch (error) {
      console.warn(error);
    }
  }

  private _getLocalVersion(): void {
    const text = this.editor.getValue();
    this.resolver.addVersion(text, 'local');
  }

  private _getEditorView(): void {
    this.cursor = this.editor.getCursor();
    this.resolver.setCursorToken(this.cursor);
    const scroll = this.editor.getScrollInfo();
    this.view = {
      left: scroll.left,
      top: scroll.top,
      right: scroll.left + scroll.clientWidth,
      bottom: scroll.top + scroll.clientHeight,
    };
  }

  private _setEditorView(): void {
    this.editor.setCursor(this.cursor);
    this.editor.scrollIntoView(this.view);
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _removeListener(signal: ISignal<any, any>, callback: any) {
    return signal.disconnect(callback, this);
  }

  private _disposedListener() {
    this._removeListener(
      (this.content.model as DocumentModel).stateChanged,
      this._dirtyStateListener
    );
  }

  private _dirtyStateListener(sender: DocumentModel, value: any) {
    if (value.name === 'dirty') {
      this._dirtyState.emit(value.newValue);
    }
  }

  private _addListeners() {
    this._addListener(
      (this.content.model as DocumentModel).stateChanged,
      this._dirtyStateListener
    );
    this._addListener(this.widget.disposed, this._disposedListener);
  }
}
