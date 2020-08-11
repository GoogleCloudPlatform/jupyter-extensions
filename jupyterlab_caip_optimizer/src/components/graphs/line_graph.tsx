import * as React from 'react';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { AxisPropsList } from '../trial_visualization';
import { getTooltipHTML, colorScheme } from './graph_utils';

// D3 Tooltip library: https://github.com/caged/d3-tip
d3.tip = d3Tip;

interface Data {
  [key: string]: any;
}

interface Props {
  width: number;
  height: number;
  axisProps: AxisPropsList;
  trialData: Data[];
  selectedMetric: string;
  metricList: string[];
}

export const LineGraph = (props: Props) => {
  const d3ContainerLineGraph = React.useRef(null);
  const axisProps = props.axisProps;
  const width = props.width;
  const height = props.height;
  const trialData = props.trialData;
  const selectedMetric = props.selectedMetric;
  const metricList = props.metricList;
  const padding = 70;
  const topPadding = padding * 0.8;

  React.useEffect(() => {
    if (
      props.trialData &&
      d3ContainerLineGraph.current &&
      width > 0 &&
      height > 0
    ) {
      /**
       * We use the useRef React Hook to make a variable that holds on to the SVG DOM component across renders.
       * It's initialized null and assigned later in the return statement.
       */
      const svg = d3.select(d3ContainerLineGraph.current);
      svg.selectAll('*').remove();

      /**
       * Set the D3 scales (both for horizontal & vertical)
       * Refer to https://github.com/d3/d3-scale#d3-scale for detailed explanation on scales in D3
       */
      const xScale = d3
        .scaleLinear()
        .domain([
          axisProps['trialId']['minVal'],
          axisProps['trialId']['maxVal'],
        ])
        .range([padding, width - padding]);

      /**
       * Dictionary of scales for all the metrics.
       * Key: metric names
       * Value: D3 scale mapping the metric value of the trial to the vertical position
       */
      const yScaleDict = {};
      metricList.forEach(metric => {
        const scale = d3
          .scaleLinear()
          .domain([axisProps[metric]['maxVal'], axisProps[metric]['minVal']])
          .range([topPadding, height - padding]);
        yScaleDict[metric] = scale;
      });
      const yScale = yScaleDict[selectedMetric];

      // Populate the axes
      const xAxis = d3.axisBottom().scale(xScale);
      const yAxis = d3
        .axisLeft()
        .scale(yScale)
        .ticks(5); // Only 5 ticks will be displayed along the yAxis;
      svg
        .append('g')
        .attr('transform', `translate(0,${height - padding})`)
        .attr('class', 'xAxis')
        .attr('id', `trialId`)
        .call(xAxis);
      svg
        .append('g')
        .attr('transform', `translate(${padding},0)`)
        .attr('class', 'yAxis')
        .attr('id', `${selectedMetric}`)
        .call(yAxis);

      /**
       * Add markers to indicate corresponding colors for each metric
       * @param metric String indicating name of the metric
       * @param index Index of the metric in the metric list. Used for getting the corresponding color.
       */
      const addColorMarker = (metric: string, index) => {
        const xPosition = padding + 10;
        const yPositionUnit = topPadding / 3;
        const yPosition = yPositionUnit * (index + 1);
        svg
          .append('circle')
          .attr('cx', xPosition)
          .attr('cy', yPositionUnit * (index + 1))
          .attr('r', 5)
          .attr('fill', colorScheme[index]);
        const markerText =
          'goal' in axisProps[metric]
            ? `${metric}: ${axisProps[metric]['goal'].toLowerCase()}`
            : metric;
        svg
          .append('text')
          .attr('x', xPosition + 10)
          .attr('y', yPosition + 3)
          .attr('font-family', 'Roboto')
          .attr('text-anchor', 'start')
          .attr('font-size', '12px')
          .text(markerText);
      };

      // label for axes
      svg
        .append('text')
        .attr('x', `${width / 2}`)
        .attr('y', `${height - padding / 2}`)
        .attr('font-family', 'Roboto')
        .attr('text-anchor', 'middle')
        .text('Trial ID');
      svg
        .append('text')
        .attr('x', `${(-1 * height) / 2}`)
        .attr('y', `${padding / 2}`)
        .attr('transform', `translate(${topPadding},0)`)
        .attr('transform', 'rotate(270)')
        .attr('font-family', 'Roboto')
        .attr('text-anchor', 'middle')
        .text(selectedMetric);

      /**
       * Draw line on the chart for each metric.
       * Dots (small circles) are placed on each point on the line, which indicates trials
       */
      metricList.forEach((metric, index) => {
        const line = d3
          .line()
          .x(function(d) {
            return xScale(d['trialId']);
          })
          .y(function(d) {
            return yScaleDict[metric](d[metric]);
          });
        svg
          .append('path')
          .datum(trialData)
          .attr('d', line)
          .style('fill', 'none')
          .style('stroke', colorScheme[index]);
        svg
          .selectAll('.dot')
          .data(trialData)
          .enter()
          .append('circle')
          .attr('id', function(d) {
            return `dot-${d['trialId']}-${metric}`;
          })
          .attr('cx', function(d) {
            return xScale(d['trialId']);
          })
          .attr('cy', function(d) {
            return yScaleDict[metric](d[metric]);
          })
          .attr('fill', colorScheme[index])
          .attr('r', 3);

        /**
         * Draw background color boxes to indicate the local max/min trials
         * for the selected metric
         */
        if (metric === selectedMetric) {
          // find list of local maximum/minimum
          const localBest = [];
          const objective =
            'goal' in axisProps[metric]
              ? axisProps[metric]['goal']
              : 'MAXIMIZE';
          trialData.forEach((trial, trialIndex) => {
            if (trialIndex === 0) localBest.push(trial);
            else {
              if (
                (objective === 'MAXIMIZE' &&
                  trial[selectedMetric] >
                    localBest[localBest.length - 1][selectedMetric]) ||
                (objective === 'MINIMIZE' &&
                  trial[selectedMetric] <
                    localBest[localBest.length - 1][selectedMetric])
              )
                localBest.push(trial);
            }
          });
          localBest.forEach((localBestTrial, localBestIndex) => {
            svg
              .append('rect')
              .style('fill', colorScheme[index])
              .attr('width', function() {
                if (localBestIndex === localBest.length - 1) {
                  return (
                    xScale(axisProps['trialId']['maxVal']) -
                    xScale(localBestTrial['trialId'])
                  );
                }
                return (
                  xScale(localBest[localBestIndex + 1]['trialId']) -
                  xScale(localBestTrial['trialId'])
                );
              })
              .attr('height', function() {
                return (
                  height -
                  padding -
                  yScaleDict[metric](localBestTrial[selectedMetric])
                );
              })
              .attr('x', xScale(localBestTrial['trialId']))
              .attr('y', yScaleDict[metric](localBestTrial[selectedMetric]))
              .style('opacity', 0.2);
          });
        }
        // Add color marker
        addColorMarker(metric, index);
      });

      // Set up tooltip
      const tip = d3
        .tip()
        .attr('class', 'd3-tip')
        .offset([-5, 0])
        .style('font-size', '12px')
        .style('font-family', 'Roboto')
        .style('background', 'rgba(199, 199, 199, 1)')
        .style('padding', '5px')
        .style('border-radius', '8px')
        .html(function(d) {
          return getTooltipHTML(d);
        });
      svg.call(tip);

      /**
       * Create invisible rectangular boxes for each trialId to display tooltips on mouse hover.
       * This is needed to retrieve the trialId from the mouse position and then make the tooltips visible.
       */
      svg
        .selectAll('.cover-group')
        .data(trialData)
        .enter()
        .append('rect')
        .style('fill', 'rgba(0, 0, 0, 0)')
        .attr('width', function(d) {
          const right = Math.min(xScale(d['trialId'] + 0.5), width);
          const left = Math.max(padding, xScale(d['trialId'] - 0.5));
          return right - left;
        })
        .attr('height', height - padding - topPadding)
        .attr('x', function(d) {
          return Math.max(padding, xScale(d['trialId'] - 0.5));
        })
        .attr('y', topPadding)
        .on('mouseenter', function(d) {
          tip.show(
            d,
            document.getElementById(`dot-${d['trialId']}-${selectedMetric}`)
          );
        })
        .on('mouseleave', tip.hide);

      /**
       * Create black dotted line that serves as a visual cue to whick trial's info (tooltip) is being shown.
       * Trial nearest to the mouse position is selected.
       */
      // Append the dotted line
      svg
        .append('path')
        .attr('class', 'mouse-line')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('opacity', '0')
        .style('stroke-dasharray', '5,5');
      // Attach interactivity
      svg
        .on('mouseenter', function() {
          svg.select('.mouse-line').style('opacity', '1');
        })
        .on('mouseleave', function() {
          svg.select('.mouse-line').style('opacity', '0');
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
            svg.select('.mouse-line').style('opacity', '1');
            const currentTrialId = Math.round(xScale.invert(mouse[0]));
            let pos = 'M' + xScale(currentTrialId) + ',' + (height - padding);
            pos += ' ' + xScale(currentTrialId) + ',' + topPadding;
            // move line
            svg.select('.mouse-line').attr('d', pos);
          } else {
            svg.select('.mouse-line').style('opacity', '0');
          }
        });
    }
  }, [
    props.trialData,
    axisProps,
    width,
    height,
    padding,
    trialData,
    selectedMetric,
  ]);

  return (
    <svg
      className="d3-scatterplot"
      width={width}
      height={height}
      ref={d3ContainerLineGraph}
    />
  );
};
