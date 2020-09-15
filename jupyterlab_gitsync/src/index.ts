// Ensure styles are loaded by webpack
import '../style/index.css';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
} from '@jupyterlab/application';

import { GitSyncService } from './service/service';
import { GitSyncWidget } from './components/panel';
import { ContentsManager, Contents } from '@jupyterlab/services';

async function activate(app: JupyterFrontEnd, shell: ILabShell) {
  const service = new GitSyncService(shell);
  const widget = new GitSyncWidget(service);
  app.shell.add(widget, 'left', { rank: 100 });
  console.log('git widget activated');

  const fs = new ContentsManager();
  const options = {
    type: 'directory' as Contents.ContentType,
    content: true,
  };

  const x = (await fs.get('.', options)).content;
  const dir = x.flatMap(file => (file.type === 'directory' ? [file] : []));
  console.log(dir);
}
/**
 * The JupyterLab plugin.
 */
const GitSyncPlugin: JupyterFrontEndPlugin<void> = {
  id: 'gitsync:gitsync',
  requires: [ILabShell],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [GitSyncPlugin];
