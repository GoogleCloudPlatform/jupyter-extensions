import * as React from 'react';
import { ServerWrapper } from './server_wrapper';
import { AreaChartWrapper } from './chart_wrapper';
import { Utilization, STYLES } from '../data';

const AREA_CHART_BLUE = {
  stroke: '#15B2D3',
  fill: '#15B2D3',
};

const AREA_CHART_ORANGE = {
  stroke: '#ff7f01',
  fill: '#ff7f01',
};

const UTILIZATION_CHART_PROPERTIES = {
  areaChartProps: {
    height: 75,
    width: 350,
  },
  yAxisProps: {
    domain: [0, 100],
  },
  cartesianGridProps: {
    horizontalPoints: [25, 50, 75],
    vertical: false,
  },
};

interface Props {
  detailsServer: ServerWrapper;
}

interface State {
  data?: Utilization[];
  receivedError: boolean;
}

export class ResourceUtilizationCharts extends React.Component<Props, State> {
  private refreshInterval: number;
  private readonly NUM_DATA_POINTS = 20;
  private readonly REFRESH_INTERVAL = 1000;
  constructor(props: Props) {
    super(props);
    const data = [];
    for (let i = 0; i < this.NUM_DATA_POINTS; i++) {
      data.push({ cpu: 0, memory: 0 });
    }
    this.state = {
      data,
      receivedError: false,
    };
  }

  componentDidMount() {
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
      const details = await this.props.detailsServer.getUtilizationData();
      const data = this.state.data.slice(1);
      data.push(details.utilization);
      this.setState({ data });
    } catch (e) {
      console.warn('Unable to retrieve GCE VM details');
      this.setState({ receivedError: true });
    }
  }
}
