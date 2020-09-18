import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { NotebookPanel, Notebook, NotebookModel } from '@jupyterlab/notebook';
import { ISignal, Signal } from '@lumino/signaling';
import { ContentsManager, Contents } from '@jupyterlab/services';

import { IFile } from './tracker';
import { NotebookResolver } from './notebook_resolver';

const fs = new ContentsManager();

export class NotebookFile implements IFile {
  manager: IDocumentManager;
  widget: NotebookPanel;
  resolver: NotebookResolver;
  view: {
    left: number;
    top: number;
  };
  cursor: {
    index: number;
    pos: {
      line: number;
      column: number;
    };
  };
  repoPath: string = undefined;

  private _mergeState: Signal<this, string> = new Signal<this, string>(this);
  private _dirtyState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(widget: NotebookPanel, manager: IDocumentManager) {
    this.manager = manager;
    this.widget = widget;
    this.resolver = new NotebookResolver(this);

    this._getInitVersion();
    this._addListeners();
  }

  get path(): string {
    return this.widget.context.path;
  }

  get content(): Notebook {
    return this.widget.content;
  }

  get context(): DocumentRegistry.Context {
    return this.widget.context;
  }

  get mergeState(): ISignal<this, string> {
    return this._mergeState;
  }

  get dirtyState(): ISignal<this, boolean> {
    return this._dirtyState;
  }

  get activeCell() {
    return this.content.activeCell;
  }

  get activeCellIndex(): number {
    return this.content.activeCellIndex;
  }

  async save(): Promise<void> {
    try {
      const content = (this.content.model as NotebookModel).toJSON();
      await this._saveFile(content);
      this.resolver.addVersion(content, 'base');
    } catch (error) {
      console.warn(error);
    }
  }

  async viewDiff(): Promise<void> {
    this.widget = this.manager.openOrReveal(this.path) as NotebookPanel;
    await this.context.ready;
    const json = this.resolver.versions.merged;
    this.content.model.fromJSON(json);
  }

  async reveal(): Promise<void> {
    this.widget = this.manager.openOrReveal(this.path) as NotebookPanel;
    await this.context.ready;
  }

  async markResolved(): Promise<void> {
    await this.save();
    this._mergeState.emit('resolved');
  }

  async reload(): Promise<NotebookFile> {
    await this._getRemoteVersion();
    this._getLocalVersion();
    this._getEditorView();
    const merged = this.resolver.mergeVersions();
    if (merged) await this._displayText(merged);
    (this.content.model as NotebookModel).dirty = false;
    return this.resolver.conflict ? this : undefined;
  }

  private async _displayText(merged): Promise<void> {
    await this._saveFile(merged);
    await this.context.revert();
    this._setEditorView();
  }

  private async _saveFile(content: any): Promise<void> {
    const options = {
      content: content,
      format: 'json' as Contents.FileFormat,
      path: this.path,
      type: 'notebook' as Contents.ContentType,
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
    const content = (this.content.model as NotebookModel).toJSON();
    this.resolver.addVersion(content, 'local');
  }

  private _getEditorView(): void {
    this.view = {
      left: this.content.node.scrollLeft,
      top: this.content.node.scrollTop,
    };
    const activeIndex = this.activeCellIndex;
    const cursorPos = this.activeCell.editor.getCursorPosition();
    this.resolver.setCursorToken(activeIndex, cursorPos);
  }

  private _setEditorView(): void {
    this.cursor = this.resolver.getCursorToken();

    if (this.cursor) {
      this.content.activeCellIndex = this.cursor.index;
      this.activeCell.editor.setCursorPosition(this.cursor.pos);
    }

    this.content.node.scrollLeft = this.view.left;
    this.content.node.scrollTop = this.view.top;
  }

  private _addListener(signal: ISignal<any, any>, callback: any) {
    return signal.connect(callback, this);
  }

  private _dirtyStateListener(sender: NotebookModel, value: any) {
    if (value.name === 'dirty') {
      this._dirtyState.emit(value.newValue);
    }
  }

  private _addListeners() {
    this._addListener(
      (this.content.model as NotebookModel).stateChanged,
      this._dirtyStateListener
    );
  }
}
