import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";


const margin = { left: 60, right: 20, top: 20, bottom: 60 };

// Helper function to aggregate scores by date and compute daily averages
function get_scores(inspections) {
  const scores = {};

  
  for (const inspection of inspections) {
    const date = inspection["date"];
    const score = Number(inspection["score"]);
    if (!scores[date]) scores[date] = [];
    scores[date].push(score);
  }

  
  const scoresData = { dates: [], scores: [] };
  for (const date in scores) {
    const avg = d3.mean(scores[date]);
    scoresData.dates.push(date);
    scoresData.scores.push(avg);
  }

  return scoresData;
}

// Function to render the score trend line chart with D3
function displayScoreTrend(svgElement, width, height, facilityScores, tooltipEl) {
  const parseDate = d3.timeParse("%m/%d/%Y");    
  const formatDate = d3.timeFormat("%b %d, %Y"); 

  
  const data = facilityScores.dates.map((d, i) => ({
    date: parseDate(d),
    score: facilityScores.scores[i],
  }));

  
  const xExtent = d3.extent(data, d => d.date);
  const yExtent = d3.extent(data, d => d.score);

  const svg = d3.select(svgElement);
  const minXAxisWidth = data.length * 100; 
  const xAxisWidth = Math.max(width, minXAxisWidth);

  svg.attr("width", xAxisWidth).attr("height", height);
  svg.selectAll("*").remove(); 

  
  const xScale = d3.scaleTime().domain(xExtent).range([margin.left, xAxisWidth - margin.right - 20]);
  const yScale = d3.scaleLinear()
    .domain([Math.max(0, yExtent[0] - 5), yExtent[1]])
    .range([height - margin.bottom, margin.top]);

  const plot = svg.append("g").attr("id", "score-plot-content");

  // X-axis with tick labels for each inspection date
  plot.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3.axisBottom(xScale)
        .tickValues(data.map(d => d.date))       
        .tickFormat(d3.timeFormat("%b %Y"))      
    )
    .selectAll("text")
    .style("font-size", "0.7rem")
    .attr("transform", "translate(0, 5)")
    .attr("text-anchor", "end");

  // Y-axis (scores)
  plot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // Axis labels
  plot.append("text")
    .attr("x", xAxisWidth / 2)
    .attr("y", height - 10)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("Inspection Date");

  plot.append("text")
    .attr("transform", `translate(20, ${(height / 2)}) rotate(-90)`)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("Inspection Score");

  // Define the line generator
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.score));

  // Draw the score trend line
  plot.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#e0385c")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Plot data points and attach tooltip interactivity
  plot.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.score))
    .attr("r", 5)
    .attr("fill", "#e0385c")
    .on("mouseenter", (event, d) => {
      tooltipEl.innerHTML = `Date: ${formatDate(d.date)}<br/>Score: ${d.score}`;
      tooltipEl.style.opacity = 1;
    })
    .on("mousemove", (event) => {
      tooltipEl.style.left = `${event.offsetX + 12}px`;
      tooltipEl.style.top = `${event.offsetY + 12}px`;
    })
    .on("mouseleave", () => {
      tooltipEl.style.opacity = 0;
    });
}

// React component that renders the inspection score trend
function ScoreTrend({ query }) {
  const containerRef = useRef(null); 
  const svgRef = useRef(null);       
  const tooltipRef = useRef(null);   

  useEffect(() => {
    
    if (!query || !containerRef.current || !svgRef.current) return;

    const encodedQuery = encodeURIComponent(query);

    // Fetch inspection records for the selected restaurant
    fetch(`http://localhost:8000/inspections/${encodedQuery}`)
      .then(res => res.json())
      .then(data => {
        const facilityScores = get_scores(data.inspections); 
        const { width, height } = containerRef.current.getBoundingClientRect();
        displayScoreTrend(svgRef.current, width, height, facilityScores, tooltipRef.current);
      });

  }, [query]); 

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative", 
      }}
    >
      {/* SVG chart area */}
      <svg ref={svgRef} />

      {/* Floating tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          background: "rgba(0, 0, 0, 0.75)",
          color: "white",
          padding: "6px 10px",
          borderRadius: "5px",
          fontSize: "12px",
          pointerEvents: "none",
          opacity: 0,
          zIndex: 100,
          transition: "opacity 0.3s",
        }}
      ></div>
    </div>
  );
}

export default ScoreTrend;
