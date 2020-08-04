import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { AxisPropsList } from '../trial_visualization';

interface Data {
  [key: string]: any;
}

interface Props {
  width: number;
  height: number;
  axisPropsList: AxisPropsList;
  lineDataList: Data[];
  axesData: Data[];
  selectedMetricForColor: string;
}

function getOrdinalRange(start, end, num) {
  const diff = ((end - start) * 1.0) / (num - 1);
  const arr = new Array(num);
  for (let i = 0; i < num; i++) {
    arr[i] = start + i * diff;
  }
  return arr;
}

interface ScaleObject {
  [key: string]: any;
}

/* Component */
export const ParallelCoordinates = (props: Props) => {
  /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */
  const d3Container = useRef(null);
  const axisPropsList = props.axisPropsList;
  const width = props.width;
  const height = props.height;
  const padding = 50;
  const lineDataList = props.lineDataList;
  const axesData = props.axesData;
  const selectedMetricForColor = props.selectedMetricForColor;
  const verticalAxes = axesData.map(axis => axis.label);
  const [axisClicked, setAxisClicked] = React.useState(false);
  const [clickedAxisName, setClickedAxisName] = React.useState('none');
  const [selectBoxDetails, setSelectBoxDetails] = React.useState({
    initialValue: 0,
    currentValue: 0,
  });

  /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */
  useEffect(() => {
    if (
      props.lineDataList &&
      axesData &&
      d3Container.current &&
      width > 0 &&
      height > 0
    ) {
      const resetSelectBox = () => {
        setAxisClicked(false);
        setClickedAxisName('none');
        setSelectBoxDetails({
          initialValue: 0,
          currentValue: 0,
        });
      };

      const svg = d3.select(d3Container.current);
      svg.selectAll('*').remove();

      const xScale = d3
        .scalePoint()
        .range([0, width])
        .padding(1)
        .domain(verticalAxes);

      const yScale: ScaleObject = {};
      const yScaleInverted: ScaleObject = {};

      // Populate axis using axesData
      axesData.forEach(axis => {
        let scale;
        switch (axis.type) {
          case 'INTEGER':
          case 'DOUBLE': {
            const axisMin = axisPropsList[axis.label]['sliderMin']
              ? axisPropsList[axis.label]['sliderMin']
              : axis.minVal;
            const axisMax = axisPropsList[axis.label]['sliderMax']
              ? axisPropsList[axis.label]['sliderMax']
              : axis.maxVal;
            scale = d3
              .scaleLinear()
              .domain([axisMin, axisMax])
              .range([padding, height - padding]);
            break;
          }
          case 'CATEGORICAL':
          case 'DISCRETE': {
            const minIndex = axisPropsList[axis.label]['sliderMinIndex'];
            const maxIndex = axisPropsList[axis.label]['sliderMaxIndex'];
            const valuesInRange = axisPropsList[axis.label]['values'].slice(
              minIndex,
              maxIndex + 1
            );
            scale = d3
              .scaleOrdinal()
              .domain(valuesInRange)
              .range(
                getOrdinalRange(padding, height - padding, valuesInRange.length)
              );
            yScaleInverted[axis.label] = d3
              .scaleQuantize()
              .domain([padding, height - padding])
              .range(valuesInRange);
            break;
          }
        }
        const verticalAxis = d3.axisLeft().scale(scale);
        yScale[axis.label] = scale;
        svg
          .append('g')
          .attr('transform', `translate(${xScale(axis.label)},0)`)
          .attr('class', 'verticalAxis')
          .attr('id', `${axis.label}`)
          .call(verticalAxis);
        svg
          .append('text')
          .attr('x', xScale(axis.label))
          .attr('y', 20)
          .attr('font-family', 'Roboto')
          .attr('text-anchor', 'middle')
          .text(axis.label);
      });

      const yScaleInvert = (axisLabel, mouseVerticalPos) => {
        const axisType = axisPropsList[axisLabel]['type'];
        switch (axisType) {
          case 'DOUBLE':
          case 'INTEGER':
            return yScale[axisLabel].invert(mouseVerticalPos);
          case 'CATEGORICAL':
          case 'DISCRETE':
            return yScaleInverted[axisLabel](mouseVerticalPos);
        }
      };

      const handleAxisRangeSelect = (
        axisLabel,
        mouseVerticalPos,
        mousemode: string
      ) => {
        switch (mousemode) {
          case 'mousedown':
            setClickedAxisName(axisLabel);
            setAxisClicked(true);
            setSelectBoxDetails({
              initialValue: yScaleInvert(axisLabel, mouseVerticalPos),
              currentValue: yScaleInvert(axisLabel, mouseVerticalPos),
            });
            break;
          case 'mousemove':
            if (axisClicked) {
              setSelectBoxDetails({
                ...selectBoxDetails,
                currentValue: yScaleInvert(axisLabel, mouseVerticalPos),
              });
            }
            break;
          case 'mouseup':
            if (axisClicked) {
              setSelectBoxDetails({
                ...selectBoxDetails,
                currentValue: yScaleInvert(axisLabel, mouseVerticalPos),
              });
            }
            setAxisClicked(false);
            break;
        }
      };

      svg
        .on('mousemove', function() {
          if (axisClicked) {
            const mouseVerticalPos = d3.mouse(this)[1];
            handleAxisRangeSelect(
              clickedAxisName,
              mouseVerticalPos,
              'mousemove'
            );
          }
        })
        .on('mouseup', function() {
          if (axisClicked) {
            const mouseVerticalPos = d3.mouse(this)[1];
            handleAxisRangeSelect(clickedAxisName, mouseVerticalPos, 'mouseup');
          }
        })
        .on('dblclick', function() {
          resetSelectBox();
        });

      const colorLine = lineDataList => {
        if (selectedMetricForColor) {
          const withinSelectedMetricRange =
            lineDataList[selectedMetricForColor] >=
              axisPropsList[selectedMetricForColor]['sliderMin'] &&
            lineDataList[selectedMetricForColor] <=
              axisPropsList[selectedMetricForColor]['sliderMax'];
          // normalized for the slider range
          return withinSelectedMetricRange
            ? d3.interpolateRdBu(
                ((lineDataList[selectedMetricForColor] -
                  axisPropsList[selectedMetricForColor]['sliderMin']) /
                  (axisPropsList[selectedMetricForColor]['sliderMax'] -
                    axisPropsList[selectedMetricForColor]['sliderMin'])) *
                  1.0
              )
            : 'rgba(0, 0, 0, 0.1)'; // light gray colored if not within the selected range of metric axis
        }
        return 'rgba(63, 81, 181, 0.8)';
      };

      const discontinousOutOfRange = lineDataList => {
        const axes = Object.keys(axisPropsList);
        for (const axis of axes) {
          if (
            axisPropsList[axis]['type'] === 'CATEGORICAL' ||
            axisPropsList[axis]['type'] === 'DISCRETE'
          ) {
            const thisDataIndex = axisPropsList[axis]['values'].indexOf(
              lineDataList[axis]
            );
            if (
              thisDataIndex < axisPropsList[axis]['sliderMinIndex'] ||
              thisDataIndex > axisPropsList[axis]['sliderMaxIndex']
            ) {
              return true;
            }
          }
        }
        return false;
      };

      const checkLineSelected = lineDataList => {
        /**
         * Discontinous parameters (categorical, discrete) have ordinal scales in D3.
         * Thus, when certain values are out of the axis range, it doesn't get interpolated nicely
         * and the lines will go through the top of the axis, which may confuse viewwers.
         * Therefore, we make the lines with out of range data points for discontinous axes to be invisible.
         */
        if (discontinousOutOfRange(lineDataList)) return 'rgba (0, 0, 0, 0)';
        if (selectBoxDetails.initialValue !== 0 && clickedAxisName !== 'none') {
          const axisType = axisPropsList[clickedAxisName]['type'];
          let withinRange = false;
          switch (axisType) {
            case 'INTEGER':
            case 'DOUBLE':
              if (
                lineDataList[clickedAxisName] >
                  Math.min(
                    selectBoxDetails.initialValue,
                    selectBoxDetails.currentValue
                  ) &&
                lineDataList[clickedAxisName] <
                  Math.max(
                    selectBoxDetails.initialValue,
                    selectBoxDetails.currentValue
                  )
              )
                withinRange = true;
              break;
            case 'DISCRETE':
            case 'CATEGORICAL': {
              const initialValueIndex = axisPropsList[clickedAxisName][
                'values'
              ].indexOf(selectBoxDetails.initialValue);
              const currentValueIndex = axisPropsList[clickedAxisName][
                'values'
              ].indexOf(selectBoxDetails.currentValue);
              const minIndex = Math.min(initialValueIndex, currentValueIndex);
              const maxIndex = Math.max(initialValueIndex, currentValueIndex);
              const thisDataIndex = axisPropsList[clickedAxisName][
                'values'
              ].indexOf(lineDataList[clickedAxisName]);
              if (thisDataIndex >= minIndex && thisDataIndex <= maxIndex)
                withinRange = true;
              break;
            }
          }
          if (withinRange) return colorLine(lineDataList);
          return 'rgba(0, 0, 0, 0.1)';
        }
        return colorLine(lineDataList);
      };

      // Add mouse click events to axes
      svg
        .selectAll('.verticalAxis')
        .attr('stroke-width', '2px')
        .style('cursor', 'pointer')
        .on('mousedown', function() {
          const axisLabel = d3.select(this).attr('id');
          const mouseVerticalPos = d3.mouse(this)[1];
          handleAxisRangeSelect(axisLabel, mouseVerticalPos, 'mousedown');
        })
        .on('mousemove', function() {
          if (axisClicked) {
            const axisLabel = d3.select(this).attr('id');
            const mouseVerticalPos = d3.mouse(this)[1];
            handleAxisRangeSelect(axisLabel, mouseVerticalPos, 'mousemove');
          }
        })
        .on('mouseup', function() {
          const axisLabel = d3.select(this).attr('id');
          const mouseVerticalPos = d3.mouse(this)[1];
          handleAxisRangeSelect(axisLabel, mouseVerticalPos, 'mouseup');
        })
        // make tick texts unselectable
        .selectAll('.tick')
        .selectAll('text')
        .style('-webkit-touch-callout', 'none')
        .style('-webkit-user-select', 'none')
        .style('-khtml-user-select', 'none')
        .style('-moz-user-select', 'none')
        .style('-ms-user-select', 'none')
        .style('user-select', 'none');

      // Render selection box
      if (selectBoxDetails.initialValue !== 0 && clickedAxisName !== 'none') {
        const yPosMax = Math.max(
          yScale[clickedAxisName](selectBoxDetails.initialValue),
          yScale[clickedAxisName](selectBoxDetails.currentValue)
        );
        const yPosMin = Math.min(
          yScale[clickedAxisName](selectBoxDetails.initialValue),
          yScale[clickedAxisName](selectBoxDetails.currentValue)
        );
        svg
          .append('rect')
          .attr('id', 'selectBox')
          .attr('x', xScale(clickedAxisName) - 5)
          .attr('y', yPosMin)
          .attr('height', yPosMax - yPosMin)
          .attr('fill', 'rgba(63, 81, 181, 0.5)') // material UI primary color with 0.1 alpha
          .attr('width', 10);
      }

      const path = d => {
        return d3.line().curve(d3.curveMonotoneX)(
          verticalAxes.map(function(p) {
            return [xScale(p), yScale[p](d[p])];
          })
        );
      };

      svg
        .selectAll('myPath')
        .data(lineDataList)
        .enter()
        .append('path')
        .attr('d', function(d) {
          return path(d);
        })
        .style('fill', 'none')
        .style('stroke', function(d) {
          return checkLineSelected(d);
        })
        .style('opacity', 0.5)
        .style('stroke-width', 2);
    }
  }, [
    axisPropsList,
    height,
    width,
    axesData,
    lineDataList,
    verticalAxes,
    axisClicked,
    selectBoxDetails,
    clickedAxisName,
  ]);

  return (
    <svg
      className="d3-component"
      width={width}
      height={height}
      ref={d3Container}
    />
  );
};
