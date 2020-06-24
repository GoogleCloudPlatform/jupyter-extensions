import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { WidgetManager } from 'gcp-jupyterlab-shared';
import { ListResourcesPanel } from './list_resources_panel';

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
}

interface ResizeOrVisible {
  resize?: Widget.ResizeMessage;
  visible?: boolean;
}

/** Widget to be registered in the left-side panel. */
export class AutoMLWidget extends ReactWidget {
  id = 'automl_widget';
  private resizeVisibleSignal = new Signal<AutoMLWidget, ResizeOrVisible>(this);
  private resizeSignal = new Signal<AutoMLWidget, Widget.ResizeMessage>(this);
  private visibleSignal = new Signal<AutoMLWidget, boolean>(this);
  private _isVisible = false;
  private _currSize: Widget.ResizeMessage = new Widget.ResizeMessage(0, 0);

  constructor(private context: Context) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-AutoMLIcon';
    this.title.caption = 'My Datasets';
    this.resizeSignal.connect(this.updateSizeVisible);
    this.visibleSignal.connect(this.updateSizeVisible);
  }

  private updateSizeVisible(
    sender: AutoMLWidget,
    event: Widget.ResizeMessage | boolean
  ) {
    if (typeof event === 'boolean') {
      sender._isVisible = event;
    } else {
      sender._currSize = event;
    }
    sender.resizeVisibleSignal.emit({
      visible: sender._isVisible,
      resize: sender._currSize,
    });
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  onResize(msg: Widget.ResizeMessage) {
    this.resizeSignal.emit(msg);
  }

  render() {
    return (
      <UseSignal signal={this.resizeVisibleSignal}>
        {(_, event: ResizeOrVisible) => {
          const w = event ? event.resize.width : 0;
          const h = event ? event.resize.height : 0;
          return (
            <ListResourcesPanel
              isVisible={this.isVisible}
              width={w}
              height={h}
              context={this.context}
            />
          );
        }}
      </UseSignal>
    );
  }
}
