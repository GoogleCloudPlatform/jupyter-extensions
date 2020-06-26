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
import * as React from 'react';
import { classes } from 'typestyle';
import {
  Details,
  STYLES,
  MAPPED_ATTRIBUTES,
  REFRESHABLE_MAPPED_ATTRIBUTES,
} from './data';
import { DetailsDialogBody } from './components/details_dialog_body';
import { ServerWrapper } from './components/server_wrapper';

interface Props {
  detailsServer: ServerWrapper;
}
interface State {
  displayedAttributes: [number, number];
  details?: Details;
  receivedError: boolean;
  shouldRefresh: boolean;
}

const ICON_CLASS = 'jp-VmStatusIcon';

/** Instance details display widget */
export class VmDetails extends React.Component<Props, State> {
  private readonly refreshInterval: number;

  constructor(props: Props) {
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
    const details = await this.props.detailsServer.get();
    if (!details.ok) {
      console.warn('Unable to retrieve GCE VM details');
      this.setState({ receivedError: true });
    } else {
      this.setState({ details: details.data as Details });
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
  private readonly detailsUrl = `gcp/v1/details`;
  private readonly detailsServer = new ServerWrapper(this.detailsUrl);
  render() {
    return <VmDetails detailsServer={this.detailsServer} />;
  }
}
