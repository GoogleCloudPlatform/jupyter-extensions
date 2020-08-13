import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, Notebook, NotebookModel } from '@jupyterlab/notebook';
import { ISignal, Signal } from '@lumino/signaling';

import { ContentsManager } from '@jupyterlab/services';

import { IFile, IResolver } from './tracker';
import { NotebookResolver } from './notebook_resolver';

const fs = new ContentsManager();

// TO DO (ashleyswang): implement most functionality for NotebookFile
// mostly a placeholder file with outline of needed functions
// so compiler doesn't complain

export class NotebookFile implements IFile {
  widget: NotebookPanel;
  context: DocumentRegistry.Context;
  resolver: IResolver;

  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(this);
  private _dirtyState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(widget: NotebookPanel) {
    this.widget = widget;
    this.context = widget.context;
    this.resolver = new NotebookResolver(this);

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
    try{
      await this.context.save();
    } catch (error) {
      console.warn(error);
    }
  }

  async reload() {
    this._getLocalVersion();
    this._getRemoteVersion();
    await this.context.revert();
  }

  private async _getRemoteVersion() {
    // TO DO (ashleyswang): change to get raw string of notebook file
    const contents = await fs.get(this.path, {content: false});
    console.log(contents.content);
  }

  private async _getLocalVersion() {
    const text = ((this.widget.content as Notebook).model as NotebookModel).toString();
    console.log('toString()', text);
    this.resolver.addVersion(text, 'local');
  }

  private _addListener(signal: ISignal<any, any>, callback: any){
    return signal.connect(callback, this);
  }

  // private _removeListener(signal: ISignal<any, any>, callback: any){
  //   return signal.disconnect(callback, this);
  // }

  private _disposedListener(){
    // TO DO (ashleyswang): add functionality to remove resources after closing document

    // this._removeListener(((this.widget.content as Notebook)
    //   .model as NotebookModel).stateChanged, this._dirtyStateListener);
  }

  private _dirtyStateListener(sender: NotebookModel, value: any){
    console.log(value);
    if (value.name === 'dirty'){ this._dirtyState.emit(value.newValue); }
  }

  private _addListeners() {
    this._addListener(((this.widget.content as Notebook)
      .model as NotebookModel).stateChanged, this._dirtyStateListener);
    this._addListener(this.widget.disposed, this._disposedListener);
  }
}
