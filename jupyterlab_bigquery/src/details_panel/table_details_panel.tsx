import * as React from 'react';

import { TableDetailsService } from './service/list_table_details';

interface Props {
  tableDetailsService: TableDetailsService;
  isVisible: boolean;
  table_id: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  // TODO(cxjia): type these details
  details: any;
}

export default class TableDetailsPanel extends React.Component<Props, State> {
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
      const details = await this.props.tableDetailsService.listTableDetails(
        this.props.table_id
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
          <div>{`Details for table ${details.id}`}</div>
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
          <div>{`Table ID: ${details.id}`}</div>
          <div>{`Table size: ${details.num_bytes} Bytes`}</div>
          <div>{`Number of rows: ${details.num_rows}`}</div>
          <div>{`Created: ${details.date_created}`}</div>
          <div>
            Table expiration:{' '}
            {details.expiration ? details.expiration : 'Never'}
          </div>
          <div>{`Last modified: ${details.last_modified}`}</div>
          <div>
            Data location: {details.location ? details.location : 'None'}
          </div>
          <br />
          <div>Schema: {details.schema ? details.schema : 'None'}</div>
        </div>
      );
    }
  }
}
