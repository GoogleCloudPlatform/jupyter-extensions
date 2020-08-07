import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { WidgetManager, DialogComponent, COLORS } from 'gcp_jupyterlab_shared';
import { ListResourcesPanel } from './list_resources_panel';
import { ManagementService } from '../service/management';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: COLORS.blue,
    },
  },
});

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
}

interface ResizeOrVisible {
  resize?: Widget.ResizeMessage;
  visible?: boolean;
}

interface Service {
  endpoint: string;
  name: string;
  documentation: string;
  isOptional: boolean;
}

// Static list of required GCP services
const REQUIRED_SERVICES: ReadonlyArray<Service> = [
  {
    name: 'Cloud AI Platform API',
    endpoint: 'aiplatform.googleapis.com',
    documentation: 'https://cloud.google.com/ai-platform',
    isOptional: false,
  },
];

/** Widget to be registered in the left-side panel. */
export class UCAIPWidget extends ReactWidget {
  id = 'ucaip_widget';
  private resizeVisibleSignal = new Signal<UCAIPWidget, ResizeOrVisible>(this);
  private resizeSignal = new Signal<UCAIPWidget, Widget.ResizeMessage>(this);
  private visibleSignal = new Signal<UCAIPWidget, boolean>(this);
  private alertSignal = new Signal<UCAIPWidget, boolean>(this);
  private _isVisible = false;
  private _currSize: Widget.ResizeMessage = new Widget.ResizeMessage(0, 0);
  private _checkedServices = false;
  private _project =
    'https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=';

  constructor(private context: Context) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-UcaipIcon';
    this.title.caption = 'My Datasets';
    this.resizeSignal.connect(this.updateSizeVisible);
    this.visibleSignal.connect(this.updateSizeVisible);
  }

  private updateSizeVisible(
    sender: UCAIPWidget,
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

  async onBeforeShow() {
    if (!this._checkedServices) {
      this._checkedServices = await this.checkServices();
    }
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

  private async checkServices() {
    const services = await ManagementService.listManagedServices();
    const enabledServices = new Set(services.map(m => m.serviceName));
    const enabled = REQUIRED_SERVICES.map(service => ({
      service,
      enabled: enabledServices.has(service.endpoint),
    }));
    const requiredServicesEnabled = enabled
      .filter(s => !s.service.isOptional)
      .every(s => s.enabled);
    if (requiredServicesEnabled === false) {
      const project = await ManagementService.getProject();
      this._project += project;
      this.alertSignal.emit(true);
    }
    return requiredServicesEnabled;
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
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
        <UseSignal signal={this.alertSignal}>
          {(_, event: boolean) => {
            return (
              <DialogComponent
                open={event || false}
                header="API Not Enabled"
                onCancel={() => this.alertSignal.emit(false)}
                onSubmit={() => window.open(this._project)}
                submitLabel={'Ok'}
              >
                <p>
                  The Unified Cloud AI Platform API is required to use this
                  extension. Enable it by clicking 'Ok' then retry. If you
                  enabled this API recently, wait a few minutes for the action
                  to propagate to our systems and try again.
                </p>
              </DialogComponent>
            );
          }}
        </UseSignal>
      </ThemeProvider>
    );
  }
}
