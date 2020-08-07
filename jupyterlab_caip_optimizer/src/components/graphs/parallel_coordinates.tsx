import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { AxisPropsList, TrialData, AxisData } from '../trial_visualization';

interface Props {
  width: number;
  height: number;
  axisPropsList: AxisPropsList;
  trialDataList: TrialData[];
  axesData: AxisData[];
  selectedMetricForColor: string;
}

interface Data {
  [key: string]: any;
}

/**
 * Creates a list of ordinal range.
 * Used for getting "num" number of positions in the between "start" and "end".
 * Needed for calculating the positions for the tick positions of discontinouso axes.
 * @param start Number indicating the start of the list
 * @param end Number indicating the end of the list
 * @param num Number of items in the list
 */
function getOrdinalRange(start: number, end: number, num: number) {
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

export const ParallelCoordinates = (props: Props) => {
  /**
   * We use the useRef React Hook to make a variable that holds on to the SVG DOM component across renders.
   * It's initialized null and assigned later in the return statement.
   */
  const d3Container = useRef(null);
  const axisPropsList = props.axisPropsList;
  const width = props.width;
  const height = props.height;
  const padding = 50;
  const trialDataList = props.trialDataList;
  const axesData = props.axesData;
  const selectedMetricForColor = props.selectedMetricForColor;
  const verticalAxes = axesData.map(axis => axis.label);
  const [axisClicked, setAxisClicked] = React.useState(false);
  const [clickedAxisName, setClickedAxisName] = React.useState('none');
  const [selectBoxDetails, setSelectBoxDetails] = React.useState({
    initialValue: 0,
    currentValue: 0,
  });

  useEffect(() => {
    if (
      props.trialDataList &&
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
      svg.selectAll('*').remove(); // Initialize the SVG element by removing all the child elements

      /**
       * Scale for the horizontal (x) positions of the axes.
       * Maps the axis labels (trial ID, parameters, metrics, etc..) to the horizontal positions.
       * Refer to https://github.com/d3/d3-scale#d3-scale for detailed explanation on scales in D3
       */
      const xScale = d3
        .scalePoint()
        .range([0, width])
        .padding(1)
        .domain(verticalAxes);

      /**
       * Dictionary of scales for all the vertical positions of axes.
       * Key: axis labels (trial ID, parameters, metrics, etc...)
       * Value: D3 scale mapping the data value of the trial to the vertical position
       */
      const yScale: ScaleObject = {};

      /**
       * Dictionary of inverted scales for all the vertical positions of axes.
       * Key: axis labels
       * Value: Inverted scale mapping the vertical positions to the data value of the trial
       * These inverted scales are needed to calculate the values of the range boxes created by user clicks
       */
      const yScaleInverted: ScaleObject = {};

      // Populate axis using axesData
      axesData.forEach((axis: Data) => {
        let scale; // Vertical scale mapping the data value of the trial to the vertical positions
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
              .scaleLinear() // linear scale is used since the axes values are continous
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
              .scaleOrdinal() // ordinal scale is used since the axes values are discontinous
              .domain(valuesInRange)
              .range(
                getOrdinalRange(padding, height - padding, valuesInRange.length)
              );
            yScaleInverted[axis.label] = d3
              .scaleQuantize() // Quantize scales used for continous domain (vertical position) and discontinous range (values)
              .domain([padding, height - padding])
              .range(valuesInRange);
            break;
          }
        }
        // Store the scale in the yScale dictionary
        yScale[axis.label] = scale;
        // Make the actual axis from scale and append to SVG
        const verticalAxis = d3.axisLeft().scale(scale);
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

      /**
       * Returns the inverted yScale for the selected axis
       * @param axisLabel Name of the axis selected
       * @param mouseVerticalPos Vertical position of the mouse along the axis
       * This function is needed because while it is easy to invert yScale for continous axes,
       * it is hard to do so for discontinous axes, and thus we made a separate inverted yScale dictionary
       * and we need to check where to look at to retrieve inverted yScale.
       */
      const yScaleInvert = (axisLabel: string, mouseVerticalPos: number) => {
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

      /**
       * Changes the React Hooks states when the user clicks and selects a range along the axis
       * so that the graph could be re-rendered with the selected box appearing
       * @param axisLabel Name of the axis selected
       * @param mouseVerticalPos Vertical position of the mouse click
       * @param mousemode Indicates the type of mouse action (down/up/move)
       */
      const handleAxisRangeSelect = (
        axisLabel: string,
        mouseVerticalPos: number,
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

      /**
       * Attaches mouse action to the whole SVG element
       * so that mouse cursor can move away from the axis while being pressed
       * and the selection would still work
       */
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

      /**
       * Trials (curved lines) passed to this function has to be displayed.
       * Returns red-blue color scheme color or default color
       * @param lineData Data for a line (i.e. trial)
       */
      const colorLine = (lineData: Data) => {
        if (selectedMetricForColor) {
          const withinSelectedMetricRange =
            lineData[selectedMetricForColor] >=
              axisPropsList[selectedMetricForColor]['sliderMin'] &&
            lineData[selectedMetricForColor] <=
              axisPropsList[selectedMetricForColor]['sliderMax'];
          // normalized for the slider range
          return withinSelectedMetricRange
            ? d3.interpolateRdBu(
                ((lineData[selectedMetricForColor] -
                  axisPropsList[selectedMetricForColor]['sliderMin']) /
                  (axisPropsList[selectedMetricForColor]['sliderMax'] -
                    axisPropsList[selectedMetricForColor]['sliderMin'])) *
                  1.0
              )
            : 'rgba(0, 0, 0, 0.1)'; // light gray colored if not within the selected range of metric axis
        }
        return 'rgba(63, 81, 181, 0.8)'; // material UI primary color with 0.8 alpha value (20% transparency)
      };

      /**
       * Check if line bleeds out of the graph becuase of axes being zoomed in/out
       * @param lineData Data for a line (i.e. trial)
       */
      const lineOutOfAxisRange = (lineData: Data) => {
        const axes = Object.keys(axisPropsList);
        for (const axis of axes) {
          if (
            axisPropsList[axis]['type'] === 'CATEGORICAL' ||
            axisPropsList[axis]['type'] === 'DISCRETE'
          ) {
            const thisDataIndex = axisPropsList[axis]['values'].indexOf(
              lineData[axis]
            );
            if (
              thisDataIndex < axisPropsList[axis]['sliderMinIndex'] ||
              thisDataIndex > axisPropsList[axis]['sliderMaxIndex']
            ) {
              return true;
            }
          } else if (
            axisPropsList[axis]['type'] === 'DOUBLE' ||
            axisPropsList[axis]['type'] === 'INTEGER'
          ) {
            const thisDataValue = lineData[axis];
            if (
              thisDataValue < axisPropsList[axis]['sliderMin'] ||
              thisDataValue > axisPropsList[axis]['sliderMax']
            ) {
              return true;
            }
          }
        }
        return false;
      };

      /**
       * Check if line is within the zoomed range of axes and also whether it goes through the selection box.
       * If so, returns the color of the line, and if not, make it invisible
       * @param lineData Data for a single line (i.e. trial)
       */
      const checkLineSelected = (lineData: Data) => {
        /**
         * Discontinous parameters (categorical, discrete) have ordinal scales in D3.
         * Thus, when certain values are out of the axis range, it doesn't get interpolated nicely
         * and the lines will go through the top of the axis, which may confuse viewwers.
         * Therefore, we make the lines with out of range data points for discontinous axes to be invisible.
         */
        if (lineOutOfAxisRange(lineData)) return 'rgba (0, 0, 0, 0)';
        if (selectBoxDetails.initialValue !== 0 && clickedAxisName !== 'none') {
          const axisType = axisPropsList[clickedAxisName]['type'];
          let withinRange = false;
          switch (axisType) {
            case 'INTEGER':
            case 'DOUBLE':
              if (
                lineData[clickedAxisName] >
                  Math.min(
                    selectBoxDetails.initialValue,
                    selectBoxDetails.currentValue
                  ) &&
                lineData[clickedAxisName] <
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
              ].indexOf(lineData[clickedAxisName]);
              if (thisDataIndex >= minIndex && thisDataIndex <= maxIndex)
                withinRange = true;
              break;
            }
          }
          if (withinRange) return colorLine(lineData);
          return 'rgba(0, 0, 0, 0.1)';
        }
        return colorLine(lineData);
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
          .attr('fill', 'rgba(63, 81, 181, 0.5)') // material UI primary color with 0.5 alpha value (50% transparency)
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
        .data(trialDataList)
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
    trialDataList,
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
