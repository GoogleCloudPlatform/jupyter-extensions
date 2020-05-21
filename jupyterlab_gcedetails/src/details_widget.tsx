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

import { ReactWidget, showDialog } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import * as csstips from 'csstips';
import * as React from 'react';
import { classes, stylesheet } from 'typestyle';

interface MachineType {
  name: string;
  description: string;
}

interface Instance {
  attributes: {
    framework: string;
    title: string;
    version: string;
  };
  cpuPlatform: string;
  id: number;
  image: string;
  machineType: MachineType;
  name: string;
  zone: string;
}

interface Project {
  numericProjectId: number;
  projectId: string;
}

interface Utilization {
  cpu: number;
  memory: number;
}

interface Gpu {
  name: string;
  driver_version: string;
  cuda_version: string;
  gpu: number;
  memory: number;
  temperature: number;
}

interface Details {
  instance: Instance;
  project: Project;
  utilization: Utilization;
  gpu: Gpu;
}

interface State {
  displayedAttributes: [number, number];
  details?: Details;
  receivedError: boolean;
  shouldRefresh: boolean;
}

interface DetailsDialogProps {
  details: Details;
}

interface AttributeMapper {
  label: string;
  mapper: (details: Details) => string;
}

// Displayable attributes
const MAPPED_ATTRIBUTES: AttributeMapper[] = [
  { label: 'VM Name', mapper: (details: Details) => details.instance.name },
  { label: 'Project', mapper: (details: Details) => details.project.projectId },
  {
    label: 'Framework',
    mapper: (details: Details) => details.instance.attributes.framework,
  },
  {
    label: 'Machine Type',
    mapper: (details: Details) =>
      `${details.instance.machineType.description} (${details.instance.machineType.name})`,
  },
];
const REFRESHABLE_MAPPED_ATTRIBUTES = [
  {
    label: 'CPU Utilization',
    mapper: (details: Details) => `CPU: ${details.utilization.cpu.toFixed(1)}%`,
  },
  {
    label: 'Memory Utilization',
    mapper: (details: Details) =>
      `Memory: ${details.utilization.memory.toFixed(1)}%`,
  },
  {
    label: 'GPU Utilization',
    mapper: (details: Details) => {
      if (!details.gpu.name) {
        return 'No GPUs';
      }
      return `GPU: ${details.gpu.name} - ${details.gpu.gpu.toFixed(1)}%`;
    },
  },
];

MAPPED_ATTRIBUTES.push(...REFRESHABLE_MAPPED_ATTRIBUTES);

/* Class names applied to the component. Exported for test selectors. */
export const STYLES = stylesheet({
  container: {
    color: 'var(--jp-ui-font-color1)',
    cursor: 'pointer',
    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size1, 13px)',
    lineHeight: '24px',
    alignItems: 'center',
    ...csstips.horizontal,
  },
  attribute: {
    marginRight: '4px',
  },
  dt: {
    display: 'table-cell',
    fontWeight: 'bold',
    lineHeight: '20px',
    padding: '2px',
    verticalAlign: 'top',
  },
  dd: {
    padding: '2px 2px 2px 24px',
    verticalAlign: 'top',
  },
  icon: {
    display: 'inline-block',
    height: '18px',
    marginRight: '4px',
    width: '18px',
  },
  listRow: {
    display: 'table-row',
    boxShadow: 'inset 0 -1px 0 0 var(--jp-border-color0)',
  },
});

const ICON_CLASS = 'jp-VmStatusIcon';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DetailsDialogBody(props: DetailsDialogProps) {
  const { details } = props;
  return (
    <dl>
      {MAPPED_ATTRIBUTES.map(am => (
        <div className={STYLES.listRow} key={am.label}>
          <dt className={STYLES.dt}>{am.label}</dt>
          <dd className={STYLES.dd}>{am.mapper(details)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Instance details display widget */
export class VmDetails extends React.Component<{}, State> {
  private readonly serverSettings = ServerConnection.defaultSettings;
  private readonly detailsUrl = `${this.serverSettings.baseUrl}gcp/v1/details`;
  private readonly refreshInterval: number;

  constructor(props: {}) {
    super(props);
    this.state = {
      displayedAttributes: [0, 1],
      receivedError: false,
      shouldRefresh: false,
    };
    this.refreshInterval = window.setInterval(() => {
      if (this.state.shouldRefresh) {
        this.getAndSetDetailsFromServer();
      }
    }, 1500);
  }

  componentDidMount() {
    this.getAndSetDetailsFromServer();
  }

  componentWillUnmount() {
    window.clearInterval(this.refreshInterval);
  }

  render() {
    const { details, receivedError } = this.state;
    const noDetailsMessage = receivedError
      ? 'Error retrieving VM Details'
      : 'Retrieving VM Details...';
    return (
      <span className={STYLES.container}>
        <span
          className={classes(STYLES.icon, ICON_CLASS)}
          title="Show all details"
          onClick={() => this.showDialog()}
        ></span>
        {details ? this.getDisplayedDetails(details) : noDetailsMessage}
      </span>
    );
  }

  private async getAndSetDetailsFromServer() {
    try {
      const response = await ServerConnection.makeRequest(
        this.detailsUrl,
        {},
        this.serverSettings
      );
      if (!response.ok) {
        this.setState({ receivedError: true });
        return;
      }
      const details = await response.json();
      this.setState({ details: details as Details });
    } catch (e) {
      console.warn('Unable to retrieve GCE VM details');
    }
  }

  private showDialog() {
    const { details, receivedError } = this.state;
    const body: string | ReactWidget = receivedError
      ? 'Unable to retrieve GCE VM details, please check your server logs'
      : ReactWidget.create(<DetailsDialogBody details={details} />);
    showDialog({
      title: 'Notebook VM Details',
      body,
    });
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
  render() {
    return <VmDetails />;
  }
}
