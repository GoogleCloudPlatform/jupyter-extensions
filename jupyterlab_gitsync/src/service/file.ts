import { IDocumentWidget, DocumentRegistry } from '@jupyterlab/docregistry';
import { ContentsManager } from '@jupyterlab/services';
import { FileEditor } from '@jupyterlab/fileeditor';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeMirror } from 'codemirror';

const fs = new ContentsManager();

export class File {
  widget: IDocumentWidget;
  context: DocumentRegistry.Context;
  path: string;
  editor: CodeMirror;
  doc: CodeMirror.doc;

  resolve: MergeResolver;
  margin;

  constructor(widget: IDocumentWidget) {
    this.widget = widget;
    this.context = widget.context;
    this.path = widget.context.path;
    this.editor = ((widget.content as FileEditor)
      .editor as CodeMirrorEditor).editor;
    this.doc = this.editor.doc;
    this.resolve = new MergeResolver(this.path);

    this._getInitVersion();
  }

  async save() {
    await this.context.save();
  }

  async reload() {
    await this.context.revert();
  }

}
