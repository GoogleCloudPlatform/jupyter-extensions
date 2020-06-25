import { ReactWidget, MainAreaWidget } from '@jupyterlab/apputils';
import { JupyterFrontEnd } from '@jupyterlab/application';

/**
 * A class that manages dataset widget instances in the Main area
 */
export class WidgetManager {
  private widgets: { [id: string]: MainAreaWidget } = {};

  constructor(private app: JupyterFrontEnd) {}

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
    }
    if (!widget.isAttached) {
      this.app.shell.add(widget, 'main');
    }
    this.app.shell.activateById(widget.id);
  }
}
