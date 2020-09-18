import { createContext } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { WidgetManager } from 'gcp_jupyterlab_shared';
import { INotebookTracker } from '@jupyterlab/notebook';

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
  notebookTracker: INotebookTracker;
}

export const AppContext = createContext<Context>(null);
