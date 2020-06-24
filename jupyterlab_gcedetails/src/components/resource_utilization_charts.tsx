import * as React from 'react';
import { ServerConnection } from '@jupyterlab/services';
import { AreaChartWrapper } from './chart_wrapper';
import {
  Utilization,
  AREA_CHART_BLUE,
  AREA_CHART_ORANGE,
  UTILIZATION_CHART_PROPERTIES,
  STYLES,
} from '../data';

interface State {
  data?: Utilization[];
  receivedError: boolean;
}

export class ResourceUtilizationCharts extends React.Component<{}, State> {
  private readonly serverSettings = ServerConnection.defaultSettings;
  private readonly detailsUrl = `${this.serverSettings.baseUrl}gcp/v1/details`;
  private readonly refreshInterval: number;
  private readonly NUM_DATA_POINTS = 20;
  private readonly REFRESH_INTERVAL = 1000;
  constructor(props: {}) {
    super(props);
    const data = [];
    for (let i = 0; i < this.NUM_DATA_POINTS; i++) {
      data.push({ cpu: 0, memory: 0 });
    }
    this.state = {
      data: data,
      receivedError: false,
    };
    this.refreshInterval = window.setInterval(() => {
      this.pollUtilizationData();
    }, this.REFRESH_INTERVAL);
  }

  componentWillUnmount() {
    window.clearInterval(this.refreshInterval);
  }

  render() {
    return (
      <span>
        {this.state.receivedError ? (
          'Unable to retrieve GCE VM details, please check your server logs'
        ) : (
          <span>
            <AreaChartWrapper
              title="CPU Usage"
              titleClass={STYLES.chartTitleSmall}
              dataKey="cpu"
              data={this.state.data}
              areaProps={AREA_CHART_ORANGE}
              {...UTILIZATION_CHART_PROPERTIES}
            />
            <AreaChartWrapper
              title="Memory Usage"
              titleClass={STYLES.chartTitleSmall}
              dataKey="memory"
              data={this.state.data}
              areaProps={AREA_CHART_BLUE}
              {...UTILIZATION_CHART_PROPERTIES}
            />
          </span>
        )}
      </span>
    );
  }

  private async pollUtilizationData() {
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
      const data = this.state.data.slice(1);
      data.push(details.utilization);
      this.setState({ data: data });
    } catch (e) {
      console.warn('Unable to retrieve GCE VM details');
      console.log(e);
    }
  }
}
