/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
} from '@jupyterlab/application';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';

import { FileEditor } from '@jupyterlab/fileeditor';

import { IDocumentWidget } from '@jupyterlab/docregistry';

import { CommentsWidget } from './components/comments_widget';

import { NewCommentDialogWidget } from './components/new_comment_dialog';


function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  palette: ICommandPalette,
  docManager: IDocumentManager
) {
  console.log('JupyterLab extension jupyterlab_comments is activated!');

  let widget: MainAreaWidget<CommentsWidget>;
  let content: CommentsWidget;

  const context = {
    labShell: labShell,
    docManager: docManager,
  };

  // Add an application command
  const command = 'comments:open';
  app.commands.addCommand(command, {
    label: 'Notebook comments in git',
    execute: () => {
      if (!widget || widget.isDisposed) {
        content = new CommentsWidget(context);
        widget = new MainAreaWidget<CommentsWidget>({ content });
        widget.id = 'jupyterlab_comments';
        widget.title.label = 'Comments';
        widget.title.closable = true;
      }

      if (!widget.isAttached) {
        app.shell.add(widget, 'right', { rank: 200 });
      }
      app.shell.activateById(widget.id);
    },
  });
  // Add the command to the palette.
  palette.addItem({ command, category: 'Collaboration' });

  //Command for adding new comment to currently selected text
  const addNewComment = 'comments:add';
  app.commands.addCommand(addNewComment, {
    execute: () => {
      const file = ((labShell.currentWidget as IDocumentWidget).content as FileEditor);
      if (!widget) {
        return;
      }
      const editor = file.editor;
      const selectionObj = file.editor.getSelection();
      console.log(selectionObj);
      console.log(editor);
      const dialogWidget = new NewCommentDialogWidget(selectionObj, context);
      dialogWidget.id = 'new_comment';

      // app.shell.add(dialogWidget, 'left');
      app.shell.activateById(dialogWidget.id);

      },
    label: 'New comment',
  });
  //Add command to file editor's right click context menu
  app.contextMenu.addItem({
      command: addNewComment,
      selector: '.jp-FileEditor',
      rank: 1
  });
}

/**
 * Initialization data for the jupyterlab_comments extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-comments',
  autoStart: true,
  activate: activate,
  requires: [ILabShell, ICommandPalette, IDocumentManager],
};

export default extension;
