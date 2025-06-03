import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const margin = { left: 60, right: 20, top: 20, bottom: 60 };

function getHistogramData(values, numBins = 10, domain = null) {
  const histogramGenerator = d3.bin();
  if (domain) {
    histogramGenerator.domain(domain);
  }
  histogramGenerator.thresholds(numBins);

  const bins = histogramGenerator(values);
  return bins.map(bin => ({
    bin: [bin.x0, bin.x1],
    count: bin.length
  }));
}

function displayHistogram(svgElement, width, height, histogramData, xLabel, yLabel) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const xDomain = [histogramData[0].bin[0], histogramData[histogramData.length - 1].bin[1]];
  const xScale = d3.scaleLinear()
    .domain(xDomain)
    .range([margin.left, width - margin.right]);

  const yMax = d3.max(histogramData, d => d.count);
  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.2])
    .range([height - margin.bottom, margin.top]);

  // x axis
  const xAxis = d3.axisBottom(xScale).ticks(histogramData.length).tickFormat(d3.format("d"));
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .style("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .text(xLabel);

  // y axis
  const yAxis = d3.axisLeft(yScale).ticks(5);
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .style("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .text(yLabel);

  svg.append("g")
    .selectAll("rect")
    .data(histogramData)
    .join("rect")
    .attr("x", d => xScale(d.bin[0]) + 1)
    .attr("y", d => yScale(d.count))
    .attr("width", d => xScale(d.bin[1]) - xScale(d.bin[0]) - 1)
    .attr("height", d => yScale(0) - yScale(d.count))
    .attr("fill", "steelblue");

  svg.append("g")
    .selectAll("text.bar-label")
    .data(histogramData)
    .join("text")
    .attr("class", "bar-label")
    .text(d => d.count)
    .attr("x", d => xScale((d.bin[0] + d.bin[1]) / 2))
    .attr("y", d => yScale(d.count) - 5)
    .style("text-anchor", "middle")
    .style("font-size", "0.8rem");
}

function DualHistogram() {
  const containerRef1 = useRef(null);
  const containerRef2 = useRef(null);
  const svgRef1 = useRef(null);
  const svgRef2 = useRef(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    d3.select("#submit").on("click.dual_histogram", () => {
      const queryValue = d3.select("#search").property("value");
      const autocompleteElements = d3.select("#autocompletes").selectAll("li").nodes();
      const autocompletes = autocompleteElements.map(el => el.textContent);
      if (autocompletes.includes(queryValue)) {
        setQuery(queryValue);
        const autoList = d3.select("#autocompletes");
        if (autoList.style("display") === "block") {
          autoList.style("display", "none");
        }
      }
    });
  }, []);

  // frequency
  useEffect(() => {
    if (!containerRef1.current || !svgRef1.current || query.length === 0) return;
    const encodedQuery = encodeURIComponent(query);
    fetch(`http://localhost:8000/frequency/${encodedQuery}`)
      .then(response => response.json())
      .then(data => {
        const freqData = data.frequency.map(item => ({
          bin: [Number(item.year), Number(item.year) + 1],
          count: item.count
        }));
        const { width, height } = containerRef1.current.getBoundingClientRect();
        displayHistogram(svgRef1.current, width, height, freqData, "Year", "Inspection Count");
      });
  }, [query]);

  // intervals
  useEffect(() => {
    if (!containerRef2.current || !svgRef2.current || query.length === 0) return;
    const encodedQuery = encodeURIComponent(query);
    fetch(`http://localhost:8000/intervals/${encodedQuery}`)
      .then(response => response.json())
      .then(data => {
        const intervalsDays = data.intervals_days; 
        const intervalsDates = data.intervals_dates; 

        const histogramData = intervalsDays.map((days, i) => ({
          bin: intervalsDates[i][0] + " to " + intervalsDates[i][1], 
          count: days,
        }));

        const svg = d3.select(svgRef2.current);
        const { width, height } = containerRef2.current.getBoundingClientRect();
        svg.selectAll("*").remove();

        const xScale = d3.scaleBand()
          .domain(histogramData.map(d => d.bin))
          .range([margin.left, width - margin.right])
          .padding(0.1);

        const yMax = d3.max(histogramData, d => d.count);
        const yScale = d3.scaleLinear()
          .domain([0, yMax])
          .range([height - margin.bottom, margin.top]);

        // x axis
        const xAxis = d3.axisBottom(xScale)
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(xAxis)
          .selectAll("text")
          .attr("transform",null)
          .style("text-anchor", "end");

        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height - 10)
          .style("text-anchor", "middle")
          .style("font-size", "0.9rem")
          .text("Interval Dates");

        // y axis
        const yAxis = d3.axisLeft(yScale).ticks(5);
        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(yAxis);

        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", 20)
          .style("text-anchor", "middle")
          .style("font-size", "0.9rem")
          .text("Interval Days");

        svg.append("g")
          .selectAll("rect")
          .data(histogramData)
          .join("rect")
          .attr("x", d => xScale(d.bin))
          .attr("y", d => yScale(d.count))
          .attr("width", xScale.bandwidth())
          .attr("height", d => yScale(0) - yScale(d.count))
          .attr("fill", "steelblue");

        svg.append("g")
          .selectAll("text.bar-label")
          .data(histogramData)
          .join("text")
          .attr("class", "bar-label")
          .text(d => d.count)
          .attr("x", d => xScale(d.bin) + xScale.bandwidth() / 2)
          .attr("y", d => yScale(d.count) - 5)
          .style("text-anchor", "middle")
          .style("font-size", "0.8rem");
      });
  }, [query]);

  return (
  <div style={{ display: "flex", flexDirection: "row", gap: "20px", width: "100%" }}>
    <div
      className="chart-container d-flex"
      ref={containerRef1}
      style={{ width: "50%", height: "300px", overflowX: "auto" }}
    >
      <svg ref={svgRef1} width="100%" height="100%"></svg>
    </div>
    <div
      className="chart-container d-flex"
      ref={containerRef2}
      style={{ width: "50%", height: "300px", overflowX: "auto" }}
    >
      <svg ref={svgRef2} width="100%" height="100%"></svg>
    </div>
  </div>
);
}

export default DualHistogram;
