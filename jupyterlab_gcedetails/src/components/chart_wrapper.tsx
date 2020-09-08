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
import { stylesheet } from 'typestyle';
import { AreaChart, Area, Tooltip, CartesianGrid, YAxis } from 'recharts';

interface ChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  title: string;
  titleClass: string;
  chartColor: {
    stroke: string;
    fill: string;
  };
  areaChartProps: {};
  areaProps: {};
  cartesianGridProps: {};
  yAxisProps: {};
}

const STYLES = stylesheet({
  chartContainer: {
    paddingBottom: '5px',
    paddingTop: '5px',
  },
});

export function AreaChartWrapper(props: ChartProps) {
  const {
    data,
    dataKey,
    title,
    titleClass,
    chartColor,
    areaChartProps,
    areaProps,
    cartesianGridProps,
    yAxisProps,
  } = props;
  return (
    <div className={STYLES.chartContainer}>
      <h1 className={titleClass}>{`${title} - ${
        data[data.length - 1][dataKey]
      }%`}</h1>
      <AreaChart {...areaChartProps} data={data}>
        <Area {...areaProps} {...chartColor} dataKey={dataKey} />
        <Tooltip />
        <CartesianGrid {...cartesianGridProps} />
        <YAxis {...yAxisProps} />
      </AreaChart>
    </div>
  );
}
