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

import {
    IDocumentManager,
} from '@jupyterlab/docmanager';

import {
  Widget
} from '@lumino/widgets';

import {
  Message
} from '@lumino/messaging';

import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { httpGitRequest } from './git'

class File {
    readonly filePath:string;
    readonly comments: any[];
    constructor(filePath : string) {
        this.filePath = filePath;
    }
}


class CommentsWidget extends Widget {

    readonly comments: HTMLUListElement;
    readonly fileName: HTMLHeadingElement;
    readonly file : File;

    constructor(file : File) {
        super();
        this.file = file;
        this.addClass('comments-widget');
        this.fileName = document.createElement('h1');
        this.node.appendChild(this.fileName);
        this.comments = document.createElement('ul');
        this.node.appendChild(this.comments);
    }



    async onUpdateRequest(msg: Message): Promise<void> {
        this.fileName.innerText = this.file.filePath;
        const serverRoot = PageConfig.getOption('serverRoot');
        const filePath = this.file.filePath;
        //Fetch detached comments
        httpGitRequest("detachedComments", "GET", filePath, serverRoot).then(response => response.json().then(content => {
                console.log("Returned by backend request: " + JSON.stringify(content));
            }));
    }
}

function activate(app: JupyterFrontEnd, labShell:ILabShell, palette:ICommandPalette, docManager: IDocumentManager) {
  console.log('JupyterLab extension jupyterlab_comments is activated!');

  let widget : MainAreaWidget<CommentsWidget>;
  let file : File;
  let content : CommentsWidget;

  // Add an application command
  const command: string = 'comments:open';
  app.commands.addCommand(command, {
    label: 'Notebook comments in git',
    execute: () => {
        var currWidget = labShell.currentWidget;
        var currentFile = docManager.contextForWidget(currWidget);
        if (currentFile === undefined) {
            //Don't activate the widget if there is no file open
            console.log("No open files to display comments for.");
        } else {
            file = new File(currentFile.path);
            content = new CommentsWidget(file);
            widget = new MainAreaWidget({content});
            widget.id = 'jupyterlab_comments';
            widget.title.label = 'Notebook comments in Git';
            widget.title.closable = true;

            if (!widget.isAttached) {
                app.shell.add(widget, 'right');
            }
            app.shell.activateById(widget.id);
        }

    }
  });

  // Add the command to the palette.
  palette.addItem({ command, category: 'Tutorial' });
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


