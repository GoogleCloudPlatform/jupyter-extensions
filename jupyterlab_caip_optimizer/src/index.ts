// Ensure styles are loaded by webpack
import '../style/index.css';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ListWordsWidget } from './components/list_words_widget';
import { ListWordsService } from './service/list_words';
import { store } from './store/store';
import { fetchStudies } from './store/studies';

async function activate(app: JupyterFrontEnd) {
  const listWordsService = new ListWordsService();
  const listWidget = new ListWordsWidget(listWordsService);
  listWidget.addClass('optimizer');
  app.shell.add(listWidget, 'left', { rank: 100 });
  store.dispatch(fetchStudies());
}

/**
 * The JupyterLab plugin.
 */
const ListWordsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'caip-optimizer',
  requires: [],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [ListWordsPlugin];
