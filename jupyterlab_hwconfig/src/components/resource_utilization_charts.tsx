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

import { Badge } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Utilization } from '../data/data';
import { STYLES } from '../data/styles';
import { AreaChartWrapper } from './chart_wrapper';
import { HardwareService } from '../service/hardware_service';

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
  areaProps: {
    isAnimationActive: false,
  },
  yAxisProps: {
    domain: [0, 100],
  },
  cartesianGridProps: {
    horizontalPoints: [25, 50, 75],
    vertical: false,
  },
};

interface GpuUtilization {
  gpu: number;
  memory: number;
}

interface Props {
  hardwareService: HardwareService;
}

interface State {
  data: Utilization[];
  gpuData: GpuUtilization[];
  receivedError: boolean;
  showGpu: boolean;
}

const LOCAL_STYLES = stylesheet({
  chartTitleSmall: {
    fontSize: '15px',
    marginLeft: '20px',
    color: 'var(--jp-ui-font-color1)',
  },
  utilizationChartsContainer: {
    padding: '0 20px 20px 0',
    backgroundColor: 'var(--jp-layout-color1)',
  },
  flexspan: {
    display: 'flex',
  },
});

export class ResourceUtilizationCharts extends React.Component<Props, State> {
  private refreshInterval: number;
  private readonly NUM_DATA_POINTS = 20;
  private readonly REFRESH_INTERVAL = 1000;
  constructor(props: Props) {
    super(props);
    const data = [];
    const gpuData = [];
    for (let i = 0; i < this.NUM_DATA_POINTS; i++) {
      data.push({ cpu: 0, memory: 0 });
      gpuData.push({ gpu: 0, memory: 0 });
    }
    this.state = {
      data,
      gpuData,
      receivedError: false,
      showGpu: false,
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
    const { data, receivedError, showGpu, gpuData } = this.state;
    return (
      <div className={LOCAL_STYLES.utilizationChartsContainer}>
        {receivedError ? (
          'Unable to retrieve GCE VM details, please check your server logs'
        ) : (
          <div className={LOCAL_STYLES.flexspan}>
            <span>
              <header className={STYLES.dialogHeader}>
                Resource Utilization <Badge value="Alpha" />
              </header>
              <AreaChartWrapper
                title="CPU Usage"
                titleClass={LOCAL_STYLES.chartTitleSmall}
                dataKey="cpu"
                data={data}
                chartColor={AREA_CHART_ORANGE}
                {...UTILIZATION_CHART_PROPERTIES}
              />
              <AreaChartWrapper
                title="Memory Usage"
                titleClass={LOCAL_STYLES.chartTitleSmall}
                dataKey="memory"
                data={data}
                chartColor={AREA_CHART_BLUE}
                {...UTILIZATION_CHART_PROPERTIES}
              />
            </span>
            {showGpu && (
              <span>
                <AreaChartWrapper
                  title="GPU Usage"
                  titleClass={LOCAL_STYLES.chartTitleSmall}
                  dataKey="gpu"
                  data={gpuData}
                  chartColor={AREA_CHART_ORANGE}
                  {...UTILIZATION_CHART_PROPERTIES}
                />
                <AreaChartWrapper
                  title="GPU Memory Usage"
                  titleClass={LOCAL_STYLES.chartTitleSmall}
                  dataKey="memory"
                  data={gpuData}
                  chartColor={AREA_CHART_BLUE}
                  {...UTILIZATION_CHART_PROPERTIES}
                />
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  private async pollUtilizationData() {
    try {
      const details = await this.props.hardwareService.getVmDetails();
      const data = this.state.data.slice(1);
      data.push(details.utilization);
      if (details.gpu.name) {
        const gpuData = this.state.gpuData.slice(1);
        gpuData.push({ gpu: details.gpu.gpu, memory: details.gpu.memory });
        this.setState({ data, gpuData, showGpu: true });
      } else {
        this.setState({ data, showGpu: false });
      }
    } catch (e) {
      console.warn('Unable to retrieve GCE VM details');
      this.setState({ receivedError: true });
    }
  }
}
