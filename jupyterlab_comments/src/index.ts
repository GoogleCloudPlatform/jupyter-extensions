import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';


/**
 * Initialization data for the jupyterlab_comments extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-comments',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-comments is activated!');

  }
};

export default extension;
