import * as React from 'react';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { AxisPropsList } from '../trial_visualization';
import { getTooltipHTML } from './graph_utils';

// D3 Tooltip library: https://github.com/caged/d3-tip
// eslint-disable-next-line no-import-assign
d3.tip = d3Tip;

interface Data {
  [key: string]: any;
}

interface Props {
  width: number;
  height: number;
  axisProps: AxisPropsList;
  trialData: Data[];
  selectedParam: string;
  selectedMetric: string;
}

export const Scatterplot = (props: Props) => {
  const d3ContainerScatterplot = React.useRef(null);
  const axisProps = props.axisProps;
  const width = props.width;
  const height = props.height;
  const trialData = props.trialData;
  const selectedParam = props.selectedParam;
  const selectedMetric = props.selectedMetric;
  const padding = 70;
  const topPadding = padding * 0.5;

  React.useEffect(() => {
    if (
      props.trialData &&
      d3ContainerScatterplot.current &&
      selectedParam &&
      selectedMetric &&
      width > 0 &&
      height > 0
    ) {
      /**
       * We use the useRef React Hook to make a variable that holds on to the SVG DOM component across renders.
       * It's initialized null and assigned later in the return statement.
       */
      const svg = d3.select(d3ContainerScatterplot.current);
      svg.selectAll('*').remove();

      /**
       * Populate the parameter axis (x-axis)
       * Refer to https://github.com/d3/d3-scale#d3-scale for detailed explanation on scales in D3
       */
      let xScale;
      const paramInfo = axisProps[selectedParam];
      switch (paramInfo.type) {
        case 'INTEGER':
        case 'DOUBLE': {
          // normal scatterplot (continuous parameter)
          const axisMin = 'minVal' in paramInfo ? paramInfo.minVal : 0;
          const axisMax = 'maxVal' in paramInfo ? paramInfo.maxVal : 0;
          xScale = d3
            .scaleLinear()
            .domain([axisMin, axisMax])
            .range([padding, width - padding]);
          break;
        }
        case 'DISCRETE':
        case 'CATEGORICAL': {
          // vertically grouped scatterplot (discontinous parameter)
          const axisValues = 'values' in paramInfo ? paramInfo.values : [];
          xScale = d3
            .scaleBand()
            .domain(axisValues)
            .range([padding, width - padding])
            .padding(1); // needed to align the dots with the axis
        }
      }
      const xAxis = d3.axisBottom().scale(xScale);
      svg
        .append('g')
        .attr('transform', `translate(0,${height - padding})`)
        .attr('class', 'xAxis')
        .attr('id', `${selectedParam}`)
        .call(xAxis);

      // populate the metric axis (y-axis)
      const yScale = d3
        .scaleLinear()
        .domain([
          axisProps[selectedMetric]['maxVal'],
          axisProps[selectedMetric]['minVal'],
        ])
        .range([topPadding, height - padding]);
      const yAxis = d3.axisLeft().scale(yScale);
      svg
        .append('g')
        .attr('transform', `translate(${padding},0)`)
        .attr('class', 'yAxis')
        .attr('id', `${selectedMetric}`)
        .call(yAxis);

      // Set up tooltip
      const tip = d3
        .tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
          return getTooltipHTML(d);
        });

      // Vertical & horizontal dotted lines following the mouse cursor
      svg
        .append('path')
        .attr('class', 'mouse-line')
        .attr('id', 'mouse-line-vertical')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('opacity', '0')
        .style('stroke-dasharray', '5,5');
      svg
        .append('path')
        .attr('class', 'mouse-line')
        .attr('id', 'mouse-line-horizontal')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('opacity', '0')
        .style('stroke-dasharray', '5,5');

      // Make the dotted lines appear/disappear depending on mouse action
      svg
        .on('mouseenter', function() {
          svg.selectAll('.mouse-line').style('opacity', '1');
        })
        .on('mouseleave', function() {
          svg.selectAll('.mouse-line').style('opacity', '0');
        })
        .on('mousemove', function() {
          // mouse moving over canvas
          const mouse = d3.mouse(this);
          if (
            mouse[0] > padding &&
            mouse[0] < width - padding &&
            mouse[1] > topPadding &&
            mouse[1] < height - padding
          ) {
            svg.selectAll('.mouse-line').style('opacity', '1');
            let verticalLinePos = 'M' + mouse[0] + ',' + (height - padding);
            verticalLinePos += ' ' + mouse[0] + ',' + topPadding;
            svg.select('#mouse-line-vertical').attr('d', verticalLinePos);
            let horizontalLinePos = 'M' + (width - padding) + ',' + mouse[1];
            horizontalLinePos += ' ' + padding + ',' + mouse[1];
            svg.select('#mouse-line-horizontal').attr('d', horizontalLinePos);
          } else {
            svg.selectAll('.mouse-line').style('opacity', '0');
          }
        });

      // plot the trials
      svg
        .append('g')
        .selectAll('dot')
        .data(trialData)
        .enter()
        .append('circle')
        .attr('cx', function(d) {
          return xScale(d[selectedParam]);
        })
        .attr('cy', function(d) {
          return yScale(d[selectedMetric]);
        })
        .attr('r', 4)
        .attr('fill', 'rgba(63, 81, 181, 0.5)')
        .on('mouseenter', tip.show)
        .on('mouseleave', tip.hide);

      // Tooltip style & add to svg
      tip
        .style('font-size', '12px')
        .style('font-family', 'Roboto')
        .style('background', 'rgba(199, 199, 199, 0.8)')
        .style('padding', '5px')
        .style('border-radius', '8px');
      svg.call(tip);

      // label for axes
      svg
        .append('text')
        .attr('x', `${width / 2}`)
        .attr('y', `${height - padding / 2}`)
        .attr('font-family', 'Roboto')
        .attr('text-anchor', 'middle')
        .text(selectedParam);
      svg
        .append('text')
        .attr('x', `${(-1 * height) / 2}`)
        .attr('y', `${padding / 2}`)
        .attr('transform', `translate(${topPadding},0)`)
        .attr('transform', 'rotate(270)')
        .attr('font-family', 'Roboto')
        .attr('text-anchor', 'middle')
        .text(selectedMetric);
    }
  }, [
    props.trialData,
    axisProps,
    selectedParam,
    selectedMetric,
    width,
    height,
    padding,
    trialData,
  ]);

  return (
    <svg
      className="d3-scatterplot"
      width={width}
      height={height}
      ref={d3ContainerScatterplot}
    />
  );
};
