import * as React from "react";
import * as d3 from "d3";
import d3Tip from "d3-tip";
import { AxisPropsList } from '../trial_visualization';

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

const colorScheme = ["darkblue", "crimson", "green", "yellow"];

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
      const svg = d3.select(d3ContainerLineGraph.current);
      svg.selectAll("*").remove();

      // Set the D3 scales (both for horizontal & vertical)
      const xScale = d3
        .scaleLinear()
        .domain([
          axisProps["trialId"]["minVal"],
          axisProps["trialId"]["maxVal"]
        ])
        .range([padding, width - padding]);

      // dictionary of all the trials
      const trialDict = {};
      trialData.forEach((trial) => {
        trialDict[trial.trialId] = trial;
      });

      const yScaleDict = {};
      metricList.forEach((metric) => {
        const scale = d3
          .scaleLinear()
          .domain([axisProps[metric]["maxVal"], axisProps[metric]["minVal"]])
          .range([topPadding, height - padding]);
        yScaleDict[metric] = scale;
      });
      const yScale = yScaleDict[selectedMetric];

      // Populate the axes
      const xAxis = d3.axisBottom().scale(xScale);
      const yAxis = d3.axisLeft().scale(yScale);
      svg
        .append("g")
        .attr("transform", `translate(0,${height - padding})`)
        .attr("class", "xAxis")
        .attr("id", `trialId`)
        .call(xAxis);
      svg
        .append("g")
        .attr("transform", `translate(${padding},0)`)
        .attr("class", "yAxis")
        .attr("id", `${selectedMetric}`)
        .call(yAxis);

      const addColorMarker = (metric, index) => {
        const xPosition = padding + 10;
        const yPositionUnit = topPadding / 3;
        const yPosition = yPositionUnit * (index + 1);
        svg
          .append("circle")
          .attr("cx", xPosition)
          .attr("cy", yPositionUnit * (index + 1))
          .attr("r", 5)
          .attr("fill", colorScheme[index]);
        svg
          .append("text")
          .attr("x", xPosition + 10)
          .attr("y", yPosition + 3)
          .attr("font-family", "Roboto")
          .attr("text-anchor", "start")
          .attr("font-size", "12px")
          .text(metric);
      };

      // label for axes
      svg
        .append("text")
        .attr("x", `${width / 2}`)
        .attr("y", `${height - padding / 2}`)
        .attr("font-family", "Roboto")
        .attr("text-anchor", "middle")
        .text("Trial ID");
      svg
        .append("text")
        .attr("x", `${(-1 * height) / 2}`)
        .attr("y", `${padding / 2}`)
        .attr("transform", `translate(${topPadding},0)`)
        .attr("transform", "rotate(270)")
        .attr("font-family", "Roboto")
        .attr("text-anchor", "middle")
        .text(selectedMetric);

      metricList.forEach((metric, index) => {
        let line = d3
          .line()
          .x(function (d) {
            return xScale(d["trialId"]);
          })
          .y(function (d) {
            return yScaleDict[metric](d[metric]);
          });
        svg
          .append("path")
          .datum(trialData)
          .attr("d", line)
          .style("fill", "none")
          .style("stroke", colorScheme[index]);
        svg
          .selectAll(".dot")
          .data(trialData)
          .enter()
          .append("circle")
          .attr("id", function (d) {
            return `dot-${d["trialId"]}-${metric}`;
          })
          .attr("cx", function (d) {
            return xScale(d["trialId"]);
          })
          .attr("cy", function (d) {
            return yScaleDict[metric](d[metric]);
          })
          .attr("fill", colorScheme[index])
          .attr("r", 3);
        if (metric === selectedMetric) {
          // find list of local maximum
          const localMax = [];
          trialData.forEach((trial, trialIndex) => {
            if (trialIndex === 0) localMax.push(trial);
            else {
              if (
                trial[selectedMetric] >
                localMax[localMax.length - 1][selectedMetric]
              )
                localMax.push(trial);
            }
          });
          console.log(localMax);
          localMax.forEach((localMaxTrial, localMaxIndex) => {
            svg
              .append("rect")
              .style("fill", colorScheme[index])
              .attr("width", function () {
                if (localMaxIndex === localMax.length - 1) {
                  return (
                    xScale(axisProps["trialId"]["maxVal"]) -
                    xScale(localMaxTrial["trialId"])
                  );
                }
                return (
                  xScale(localMax[localMaxIndex + 1]["trialId"]) -
                  xScale(localMaxTrial["trialId"])
                );
              })
              .attr("height", function () {
                return (
                  height -
                  padding -
                  yScaleDict[metric](localMaxTrial[selectedMetric])
                );
              })
              .attr("x", xScale(localMaxTrial["trialId"]))
              .attr("y", yScaleDict[metric](localMaxTrial[selectedMetric]))
              .style("opacity", 0.2);
          });
        }
        // Add color marker
        addColorMarker(metric, index);
      });

      const getTooltipHTML = (data) => {
        const keys = Object.keys(data);
        const dataList = keys.map((key) => `${key}: ${data[key]}`);
        return dataList.join("<br/>");
      };

      // Set up tooltip
      const tip = d3
        .tip()
        .attr("class", "d3-tip")
        .html(function (d) {
          return getTooltipHTML(d);
        });
      svg.call(tip);
      // tooltip
      let focus = svg
        .append("g")
        .attr("class", "focus")
        .style("display", "none");

      // focus.append("circle").attr("r", 5).attr("fill");

      // Black vertical line following mouse cursor
      svg
        .append("path")
        .attr("class", "mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "0")
        .style("stroke-dasharray", "5,5");
      svg
        .selectAll(".cover-group")
        .data(trialData)
        .enter()
        .append("rect")
        .style("fill", "rgba(0, 0, 0, 0)")
        .attr("width", function (d) {
          const right = Math.min(xScale(d["trialId"] + 0.5), width);
          const left = Math.max(padding, xScale(d["trialId"] - 0.5));
          return right - left;
        })
        .attr("height", height - padding - topPadding)
        .attr("x", function (d) {
          return Math.max(padding, xScale(d["trialId"] - 0.5));
        })
        .attr("y", topPadding)
        .on("mouseenter", function (d) {
          tip.show(
            d,
            document.getElementById(`dot-${d["trialId"]}-${selectedMetric}`)
          );
        })
        .on("mouseleave", tip.hide);
      tip
        .offset([-5, 0])
        .style("font-size", "12px")
        .style("font-family", "Roboto")
        .style("background", "rgba(199, 199, 199, 1)")
        .style("padding", "5px")
        .style("border-radius", "8px");
      svg
        .on("mouseenter", function () {
          focus.style("display", null);
          d3.select(".mouse-line").style("opacity", "1");
        })
        .on("mouseleave", function () {
          focus.style("display", "none");
          d3.select(".mouse-line").style("opacity", "0");
        })
        .on("mousemove", function () {
          // mouse moving over canvas
          var mouse = d3.mouse(this);
          if (
            mouse[0] > padding &&
            mouse[0] < width - padding &&
            mouse[1] > topPadding &&
            mouse[1] < height - padding
          ) {
            d3.select(".mouse-line").style("opacity", "1");
            const currentTrialId = Math.round(xScale.invert(mouse[0]));
            let pos = "M" + xScale(currentTrialId) + "," + (height - padding);
            pos += " " + xScale(currentTrialId) + "," + topPadding;
            // move line
            d3.select(".mouse-line").attr("d", pos);
            // move tooltip
            focus
              .select(".tooltip")
              .attr("x", xScale(currentTrialId))
              .attr("y", height - padding * 2);
          } else {
            d3.select(".mouse-line").style("opacity", "0");
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
    selectedMetric
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
