import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const margin = { top: 20, right: 30, bottom: 60, left: 60 };

function displayViolationTrend(svgElement, tooltipElement, width, height, dataMap) {
  const parseDate = d3.timeParse("%m/%d/%Y");
  const formatDate = d3.timeFormat("%b %d, %Y");

  // Convert dataMap to an array of date/count objects
  const data = Object.entries(dataMap).map(([date, count]) => ({
    date: parseDate(date),
    count: +count,
  }));

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove(); 

  // Define axis limits
  const xExtent = d3.extent(data, d => d.date);
  const yMax = d3.max(data, d => d.count);
  const yMin = Math.max(0, d3.min(data, d => d.count) - 1);

  svg.attr("width", width).attr("height", height);

  // Define x and y scales
  const xScale = d3.scaleTime().domain(xExtent).range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain([yMin, yMax + 1]).range([height - margin.bottom, margin.top]);

  // Draw axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-40)")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // Axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .style("text-anchor", "middle")
    .style("font-size", "0.8rem")
    .text("Inspection Date");

  svg.append("text")
    .attr("transform", `translate(5) rotate(-90)`)
    .attr("y", 12)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", "0.8rem")
    .text("Violations Count");

  // Line for violation trend
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.count));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#540e0b")
    .attr("stroke-width", 2)
    .attr("d", line);

  const tooltip = d3.select(tooltipElement);

  // Circles and tooltip interactions
  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.count))
    .attr("r", 5)
    .attr("fill", "#540e0b")
    .on("mouseenter", function (event, d) {
      tooltip.style("opacity", 1).html(
        `<strong>Date:</strong> ${formatDate(d.date)}<br/>
         <strong>Violations:</strong> ${d.count}`
      );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseleave", function () {
      tooltip.style("opacity", 0);
    });
}

function ViolationsChart({ query }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!query || !containerRef.current || !svgRef.current) return;

    const encodedQuery = encodeURIComponent(query);

    // Fetch inspection data and count violations per date
    fetch(`http://localhost:8000/inspections/${encodedQuery}`)
      .then(res => res.json())
      .then(data => {
        const inspections = data.inspections;
        const countByDate = new Map();

        inspections.forEach(insp => {
          const date = insp.date;
          if (!countByDate.has(date)) {
            countByDate.set(date, insp.violations.length);
          }
        });

        const { width, height } = containerRef.current.getBoundingClientRect();
        displayViolationTrend(svgRef.current, tooltipRef.current, width, height, Object.fromEntries(countByDate));
      });
  }, [query]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
      {/* Tooltip for hovering over data points */}
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          background: "rgba(0, 0, 0, 0.75)",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          opacity: 0,
          zIndex: 1000,
          transition: "opacity 0.3s ease",
          whiteSpace: "nowrap"
        }}
      ></div>
    </div>
  );
}

export default ViolationsChart;
