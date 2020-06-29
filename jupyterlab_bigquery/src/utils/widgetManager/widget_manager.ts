import { ReactWidget, MainAreaWidget } from '@jupyterlab/apputils';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import rootReducer from '../../reducers';
import { Widget } from '@phosphor/widgets';
import { ReduxReactWidget } from './redux_react_widget';

/**
 * A class that manages dataset widget instances in the Main area
 */
export class WidgetManager {
  private widgets: { [id: string]: Widget } = {};
  private reduxWidgets: { [id: string]: ReduxReactWidget } = {};
  private store: EnhancedStore;

  constructor(private app: JupyterFrontEnd) {
    this.store = configureStore({ reducer: rootReducer });

    return this;
  }

  launchWidget(
    widgetType: new (...args: any[]) => ReduxReactWidget,
    windowType: string,
    id?: string,
    ...args: any[]
  ) {
    id = id !== undefined ? id : widgetType.toString();

    let widget = this.reduxWidgets[id];
    if (!widget || widget.isDisposed) {
      widget = new widgetType(args);
      widget.setProviderProps({ store: this.store });

      widget.disposed.connect(() => {
        if (this.reduxWidgets[id] === widget) {
          delete this.reduxWidgets[id];
        }
      });

      this.reduxWidgets[id] = widget;
    }

    if (!widget.isAttached) {
      this.app.shell.add(widget, windowType);
    }
    this.app.shell.activateById(widget.id);
  }

  /**
   * Launch a widget on main window
   *
   * @deprecated Use launchWidget
   *
   * @param id unique identifier for the widget.
   * @param widgetType widget types
   * @param args Props for the widget
   */
  launchWidgetForId(
    id: string,
    widgetType: new (...args: any[]) => ReactWidget,
    ...args: any[]
  ) {
    // Get the widget associated with a dataset/resource id, or create one
    // if it doesn't exist yet and activate it
    let widget = this.widgets[id];
    if (!widget || widget.isDisposed) {
      const content = new widgetType(...args);
      widget = new MainAreaWidget({ content });
      widget.disposed.connect(() => {
        if (this.widgets[id] === widget) {
          delete this.widgets[id];
        }
      });
      this.widgets[id] = widget;
      widget.id = id;
    }
    if (!widget.isAttached) {
      this.app.shell.add(widget, 'main');
    }
    this.app.shell.activateById(widget.id);
  }
}
