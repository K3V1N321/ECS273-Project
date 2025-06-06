import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function displayPieChart(svgElement, tooltipElement, containerElement, width, height, violationCountsData) {
  const radius = Math.min(width, height) / 2.2;

  
  const color = d3.scaleOrdinal().range([
    "#A1C6EA", "#F8B195", "#F67280", "#C06C84", "#6C5B7B",
    "#355C7D", "#99B898", "#FFE0AC", "#FFB347"
  ]);

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove(); 

  
  const container = svg.append("g").attr("transform", `translate(${width / 5}, ${height / 2})`);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const arcs = pie(violationCountsData);

  const groups = container.selectAll("g").data(arcs).enter().append("g");

  
  groups.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.violation))
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .on("mouseenter", (event, d) => {
      d3.select(tooltipElement)
        .html(`<strong>${d.data.violation}</strong><br/>Count: ${d.data.count} (${d.data.percentage.toFixed(1)}%)`)
        .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      const [x, y] = d3.pointer(event, containerElement);  
      d3.select(tooltipElement)
        .style("left", `${x + 8}px`)
        .style("top", `${y + 8}px`);
    })
    .on("mouseleave", () => {
      d3.select(tooltipElement).style("opacity", 0);
    });

  // Add percentage labels to each slice
  groups.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(d => `${d.data.percentage.toFixed(1)}%`);

  // Render legend on right side
  const legend = svg.append("g").attr("transform", `translate(${width - 650}, 20)`);
  const legendItems = legend.selectAll("g").data(arcs).enter().append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legendItems.append("rect").attr("width", 12).attr("height", 12).attr("fill", d => color(d.data.violation));
  legendItems.append("text").attr("x", 16).attr("y", 10).text(d => `# ${d.data.violation}`).style("font-size", "12px");
}

function ViolationsChart({ query }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!query || !containerRef.current || !svgRef.current) return;

    const encodedQuery = encodeURIComponent(query);

    // Fetch inspection data and prepare violation counts
    fetch(`http://localhost:8000/inspections/${encodedQuery}`)
      .then(res => res.json())
      .then(data => {
        const counts = {};
        let totalViolations = 0;

        data.inspections.forEach(insp => {
          insp.violations.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
            totalViolations++;
          });
        });

        // Format data for pie chart rendering
        const violationData = Object.entries(counts).map(([violation, count]) => ({
          violation,
          count,
          percentage: (count / totalViolations) * 100,
        }));

        const { width, height } = containerRef.current.getBoundingClientRect();
        displayPieChart(svgRef.current, tooltipRef.current, containerRef.current, width, height, violationData);
        setDataLoaded(true);
      });
  }, [query]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative", overflowX: "auto" }}
    >
      <svg ref={svgRef} width="100%" height="100%" />
      {/* Floating tooltip for pie chart */}
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          background: "rgba(0,0,0,0.75)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "5px",
          pointerEvents: "none",
          fontSize: "13px",
          opacity: 0,
          zIndex: 1000,
          whiteSpace: "nowrap"
        }}
      ></div>
    </div>
  );
}

export default ViolationsChart;
