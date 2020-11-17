import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';

/**
 * Initialization data for the jupyterlab_realtime_collab extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-realtime-collab',
  autoStart: true,
  activate: activatePlugin
};

export class CollabExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    // do some setup for the stuff to communicate with the backend.
    // maybe have a self contained object/class that handles notebook syncing and updating local content?
    console.log('jupyterlab_realtime_collab has started!');
    return new DisposableDelegate(() => {
    });
  }
}

function activatePlugin(app: JupyterFrontEnd) {
  console.log('activating jupyterlab-realtime-collaboration');
  app.docRegistry.addWidgetExtension('Notebook', new CollabExtension());
};

export default extension;
