/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { classes } from 'typestyle';
import { STYLES } from './data/styles';
import {
  Details,
  MAPPED_ATTRIBUTES,
  REFRESHABLE_MAPPED_ATTRIBUTES,
} from './data/data';
import { getMachineTypeConfigurations } from './data/machine_types';
import { HardwareConfigurationDialog } from './components/hardware_configuration_dialog';
import { ResourceUtilizationCharts } from './components/resource_utilization_charts';
import { ServerWrapper } from './components/server_wrapper';
import { WidgetPopup } from './components/widget_popup';
import { NotebooksService } from './service/notebooks_service';
import { DetailsService } from './service/details_service';
import { PriceService } from './service/price_service';

interface Props {
  detailsServer: ServerWrapper;
  detailsService: DetailsService;
  notebookService: NotebooksService;
  priceService: PriceService;
  initializationError?: boolean;
}

interface State {
  receivedError: boolean;
  shouldRefresh: boolean;
  dialogDisplayed: boolean;
  displayedAttributes: [number, number];
  details?: Details;
}

const ICON_CLASS = 'jp-VmStatusIcon';

/** Instance details display widget */
export class VmDetails extends React.Component<Props, State> {
  private readonly refreshInterval: number;

  constructor(props: Props) {
    super(props);
    this.state = {
      displayedAttributes: [0, 1],
      receivedError: props.initializationError,
      shouldRefresh: false,
      dialogDisplayed: false,
    };
    this.refreshInterval = window.setInterval(() => {
      if (this.state.shouldRefresh) {
        this.updateUtilizationData();
      }
    }, 1500);
  }

  componentDidMount() {
    const { initializationError } = this.props;
    !initializationError && this.initializeDetailsFromServer();
  }

  componentWillUnmount() {
    window.clearInterval(this.refreshInterval);
  }

  render() {
    const { details, dialogDisplayed, receivedError } = this.state;
    const { detailsServer, notebookService, priceService } = this.props;
    const noDetailsMessage = receivedError
      ? 'Error retrieving VM Details'
      : 'Retrieving VM Details...';

    return (
      <span className={STYLES.container}>
        <span
          className={classes(STYLES.icon, ICON_CLASS, STYLES.interactiveHover)}
          title="Show all details"
          onClick={() => this.setState({ dialogDisplayed: true })}
        ></span>
        <WidgetPopup>
          <ResourceUtilizationCharts detailsServer={detailsServer} />
        </WidgetPopup>
        <span className={STYLES.interactiveHover}>
          {details ? this.getDisplayedDetails(details) : noDetailsMessage}
        </span>
        {dialogDisplayed && (
          <HardwareConfigurationDialog
            open={dialogDisplayed}
            details={details}
            detailsServer={detailsServer}
            receivedError={receivedError}
            notebookService={notebookService}
            priceService={priceService}
            onClose={() => this.setState({ dialogDisplayed: false })}
            onCompletion={() => this.initializeDetailsFromServer()}
          />
        )}
      </span>
    );
  }

  private async initializeDetailsFromServer() {
    const { detailsServer, detailsService } = this.props;
    try {
      const details = (await detailsServer.getUtilizationData()) as Details;
      const [machineTypes, acceleratorTypes] = await Promise.all([
        detailsService.getMachineTypes(),
        detailsService.getAcceleratorTypes(),
      ]);

      details.machineTypes = getMachineTypeConfigurations(machineTypes);
      details.acceleratorTypes = acceleratorTypes;

      this.setState({ details });
    } catch (e) {
      console.warn('Unable to retrieve GCE VM details');
      this.setState({ receivedError: true });
    }
  }

  private async updateUtilizationData() {
    const { detailsServer } = this.props;
    try {
      const details = (await detailsServer.getUtilizationData()) as Details;

      this.setState({
        details: {
          ...this.state.details,
          utilization: details.utilization,
        },
      });
    } catch (e) {
      console.warn('Unable to retrieve GCE VM details');
      this.setState({ receivedError: true });
    }
  }

  private cycleDisplayed() {
    const [d1, d2] = this.state.displayedAttributes;
    const displayedAttributes: [number, number] = [
      (d1 + 1) % MAPPED_ATTRIBUTES.length,
      (d2 + 1) % MAPPED_ATTRIBUTES.length,
    ];
    const [a1, a2] = MAPPED_ATTRIBUTES.slice(
      displayedAttributes[0],
      displayedAttributes[1] + 1
    );
    let shouldRefresh = false;
    if (
      REFRESHABLE_MAPPED_ATTRIBUTES.includes(a1) ||
      REFRESHABLE_MAPPED_ATTRIBUTES.includes(a2)
    ) {
      shouldRefresh = true;
    }

    this.setState({
      displayedAttributes,
      shouldRefresh,
    });
  }

  private getDisplayedDetails(details: Details): JSX.Element {
    const { displayedAttributes } = this.state;
    return (
      <React.Fragment>
        {displayedAttributes.map((d, i) => (
          <span
            key={i}
            className={STYLES.attribute}
            title={`${MAPPED_ATTRIBUTES[d].label} - Click to cycle`}
            onClick={() => this.cycleDisplayed()}
          >
            {MAPPED_ATTRIBUTES[d].mapper(details)}
            {i === 0 ? ' | ' : ''}
          </span>
        ))}
      </React.Fragment>
    );
  }
}

/** Top-level widget exposed to JupyterLab for showing VM details. */
export class VmDetailsWidget extends ReactWidget {
  constructor(
    private detailsServer: ServerWrapper,
    private notebookService: NotebooksService,
    private detailsService: DetailsService,
    private priceService: PriceService,
    private initializationError: boolean
  ) {
    super();
  }

  render() {
    return (
      <VmDetails
        detailsServer={this.detailsServer}
        detailsService={this.detailsService}
        notebookService={this.notebookService}
        priceService={this.priceService}
        initializationError={this.initializationError}
      />
    );
  }
}
