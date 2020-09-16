import {
  DocumentWidget,
  DocumentRegistry,
  DocumentModel,
} from '@jupyterlab/docregistry';
import { ISignal, Signal } from '@lumino/signaling';
import { ContentsManager, Contents } from '@jupyterlab/services';

import { FileEditor } from '@jupyterlab/fileeditor';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeMirror } from 'codemirror';

import { IFile } from './tracker';
import { TextResolver } from './text_resolver';

const fs = new ContentsManager();

export class TextFile implements IFile {
  widget: DocumentWidget;
  context: DocumentRegistry.Context;
  editor: CodeMirror;
  doc: CodeMirror.doc;
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

  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(
    this
  );
  private _dirtyState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(widget: DocumentWidget) {
    this.widget = widget;
    this.context = widget.context;
    this.editor = ((widget.content as FileEditor)
      .editor as CodeMirrorEditor).editor;
    this.doc = this.editor.doc;
    this.resolver = new TextResolver(this);

    this._getInitVersion();
    this._addListeners();
  }

  get path(): string {
    return this.widget.context.path;
  }

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
  }

  get dirtyState(): ISignal<this, boolean> {
    return this._dirtyState;
  }

  async save() {
    try {
      const text = this.doc.getValue();
      await this._saveFile(text);
      this.resolver.addVersion(text, 'base');
    } catch (error) {
      console.warn(error);
    }
  }

  async reload() {
    await this._getRemoteVersion();
    this._getLocalVersion();
    this._getEditorView();
    const text = await this.resolver.mergeVersions();
    if (text) {
      await this._displayText(text);
    }
    ((this.widget.content as FileEditor).model as DocumentModel).dirty = false;
  }

  private async _displayText(text: string) {
    await this._saveFile(text);
    await this.context.revert();
    this._setEditorView();
  }

  private async _saveFile(text: string) {
    const options = {
      content: text,
      format: 'text' as Contents.FileFormat,
      path: this.path,
      type: 'file' as Contents.ContentType,
    };
    await fs.save(this.path, options);
  }

  private async _getInitVersion() {
    const contents = await fs.get(this.path);
    this.resolver.addVersion(contents.content, 'base');
    this.resolver.addVersion(contents.content, 'remote');
    this.resolver.addVersion(contents.content, 'local');
  }

  private async _getRemoteVersion() {
    try {
      const contents = await fs.get(this.path);
      this.resolver.addVersion(contents.content, 'remote');
    } catch (error) {
      console.warn(error);
    }
  }

  private _getLocalVersion() {
    const text = this.doc.getValue();
    this.resolver.addVersion(text, 'local');
  }

  private _getEditorView() {
    this.cursor = this.doc.getCursor();
    this.resolver.setCursorToken(this.cursor);
    const scroll = this.editor.getScrollInfo();
    this.view = {
      left: scroll.left,
      top: scroll.top,
      right: scroll.left + scroll.clientWidth,
      bottom: scroll.top + scroll.clientHeight,
    };
  }

  private _setEditorView() {
    this.cursor = this.resolver.getCursorToken();
    this.doc.setCursor(this.cursor);
    this.editor.scrollIntoView(this.view);
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _removeListener(signal: ISignal<any, any>, callback: any) {
    return signal.disconnect(callback, this);
  }

  private _disposedListener() {
    this._removeListener(this.resolver.conflictState, this._conflictListener);
    this._removeListener(
      ((this.widget.content as FileEditor).model as DocumentModel).stateChanged,
      this._dirtyStateListener
    );
  }

  private _conflictListener(sender: TextResolver, conflict: boolean) {
    this._conflictState.emit(conflict);
  }

  private _dirtyStateListener(sender: DocumentModel, value: any) {
    if (value.name === 'dirty') {
      this._dirtyState.emit(value.newValue);
    }
  }

  private _addListeners() {
    this._addListener(this.resolver.conflictState, this._conflictListener);
    this._addListener(
      ((this.widget.content as FileEditor).model as DocumentModel).stateChanged,
      this._dirtyStateListener
    );
    this._addListener(this.widget.disposed, this._disposedListener);
  }
}
