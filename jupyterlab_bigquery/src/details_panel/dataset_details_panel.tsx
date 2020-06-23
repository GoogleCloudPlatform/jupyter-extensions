import * as React from 'react';

import { DatasetDetailsService } from './service/list_dataset_details';

interface Props {
  datasetDetailsService: DatasetDetailsService;
  isVisible: boolean;
  dataset_id: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  // TODO(cxjia): type these details
  details: any;
}

export default class DatasetDetailsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} },
    };
  }

  async componentDidMount() {
    try {
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const isFirstLoad =
      !(this.state.hasLoaded || prevProps.isVisible) && this.props.isVisible;
    if (isFirstLoad) {
      this.getDetails();
    }
  }

  private async getDetails() {
    console.log('starting getDetails');
    try {
      this.setState({ isLoading: true });
      const details = await this.props.datasetDetailsService.listDatasetDetails(
        this.props.dataset_id
      );
      this.setState({ hasLoaded: true, details });
      console.log('Details: ', this.state.details);
    } catch (err) {
      console.warn('Error retrieving dataset details', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const details = this.state.details.details;
    if (this.state.isLoading) {
      return <div>loading</div>;
    } else {
      return (
        <div style={{ margin: 30 }}>
          <div>{`Details for dataset ${details.id}`}</div>
          <br />
          <div>
            Description: {details.description ? details.description : 'None'}
          </div>
          <div>
            Labels:{' '}
            {details.labels ? (
              <ul>
                {details.labels.map((value, index) => {
                  return <li key={index}>{value}</li>;
                })}
              </ul>
            ) : (
              'None'
            )}
          </div>
          <br />
          <div>{`Dataset ID: ${details.id}`}</div>
          <div>{`Created: ${details.date_created}`}</div>
          <div>
            Default table expiration:{' '}
            {details.default_expiration ? details.default_expiration : 'Never'}
          </div>
          <div>{`Last modified: ${details.last_modified}`}</div>
          <div>
            Data location: {details.location ? details.location : 'None'}
          </div>
        </div>
      );
    }
  }
}
