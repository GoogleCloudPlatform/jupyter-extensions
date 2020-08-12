// Ensure styles are loaded by webpack
import '../style/index.css';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
} from '@jupyterlab/application';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IEditorTracker } from '@jupyterlab/fileeditor';

import { FileTracker } from './service/tracker';
import { GitManager } from './service/git';
import { GitSyncService } from './service/service';
import { GitSyncWidget } from './components/panel';

async function activate(
  app: JupyterFrontEnd,
  manager: IDocumentManager,
  shell: ILabShell,
  editor: IEditorTracker
) {
  // TO DO (ashleyswang): add config method to determine path and options for git sync 
  const path = './jupyterlab_gitsync/TEST';
  const options = {remote: 'origin', worktree: 'ashleyswang/master'};
  
  // TO DO (ashleyswang): change so service creates git/files instead of passing in
  const git = new GitManager(path, options);
  const files = new FileTracker(editor, shell);
  const service = new GitSyncService(git, files);

  const widget = new GitSyncWidget(service);
  widget.addClass('jp-CookiesIcon');
  app.shell.add(widget, 'left', { rank: 100 });
  console.log('git widget activated');
}

/**
 * The JupyterLab plugin.
 */
const GitSyncPlugin: JupyterFrontEndPlugin<void> = {
  id: 'gitsync:gitsync',
  requires: [IDocumentManager, ILabShell, IEditorTracker],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [GitSyncPlugin];
