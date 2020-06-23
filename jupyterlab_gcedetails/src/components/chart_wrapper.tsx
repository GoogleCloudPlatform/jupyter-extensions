import * as React from 'react';
import { AreaChart, Area, Tooltip, CartesianGrid, YAxis } from 'recharts';

type ChartProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  title: string;
  titleClass: string;
  height: number;
  width: number;
  stroke: string;
  fill: string;
  hideYAxis: boolean;
  yDomain: number[];
  horizontalPoints: number[];
  showHorizontalGrid: boolean;
  showVerticalGrid: boolean;
};

export const AreaChartWrapper = ({
  data,
  dataKey,
  title,
  titleClass,
  height,
  width,
  stroke,
  fill,
  hideYAxis,
  yDomain,
  horizontalPoints,
  showHorizontalGrid,
  showVerticalGrid,
}: ChartProps) => (
  <span>
    <h1 className={titleClass}>{title}</h1>
    <AreaChart height={height} width={width} data={data}>
      <Area
        stroke={stroke}
        fill={fill}
        isAnimationActive={false}
        dataKey={dataKey}
      />
      <Tooltip />
      <CartesianGrid
        horizontalPoints={horizontalPoints}
        horizontal={showHorizontalGrid}
        vertical={showVerticalGrid}
      />
      <YAxis hide={hideYAxis} domain={yDomain} />
    </AreaChart>
  </span>
);
