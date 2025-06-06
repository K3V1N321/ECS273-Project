import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

// Define margins for the bar chart layout
const margin = { left: 40, right: 20, top: 20, bottom: 60 };

// Helper function to extract and average inspection scores by date
function get_scores(inspections) {
  const scores = {};

  // Group scores by date
  for (const inspection of inspections) {
    const date = inspection["date"];
    const score = Number(inspection["score"]);
    if (!scores[date]) scores[date] = [];
    scores[date].push(score);
  }

  // Compute average score for each date
  const scoresData = { dates: [], scores: [] };
  for (const date in scores) {
    const avg = d3.mean(scores[date]);
    scoresData.dates.push(date);
    scoresData.scores.push(avg);
  }

  return scoresData;
}

// Function to render the bar chart comparing inspection score and public rating
function displayBarChart(svgElement, width, height, averageScore, rating) {
  const categories = ["Inspection Score", "Public Rating (Scaled)"];

  // Prepare data for both bars
  const data = [{ category: "Inspection Score", value: averageScore }];
  if (!isNaN(rating)) {
    data.push({ category: "Public Rating (Scaled)", value: rating });
  }

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove(); // Clear existing chart contents

  const xAxisWidth = Math.max(width, 600); // Ensure minimum width for label spacing
  svg.attr("width", xAxisWidth);

  // Create x and y scales
  const xScale = d3.scaleBand()
    .rangeRound([margin.left, xAxisWidth - margin.right - 20])
    .padding(0.3)
    .domain(categories);

  const yScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain([0, 1]); // Scores and ratings are normalized between 0 and 1

  const plot = svg.append("g").attr("id", "rating-inspection-content");

  // Draw x-axis
  plot.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  // Draw y-axis
  plot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // Add x-axis label
  plot.append("text")
    .attr("x", xAxisWidth / 2)
    .attr("y", height - 5)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("Type");

  // Add y-axis label
  plot.append("text")
    .attr("transform", `translate(10, ${height / 2}) rotate(-90)`)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("Score");

  // Draw bars
  plot.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => xScale(d.category))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", d => Math.abs(yScale(0) - yScale(d.value)))
    .attr("fill", "#0091af");

  // Add value labels above bars
  plot.selectAll("text.value")
    .data(data)
    .join("text")
    .attr("class", "value")
    .text(d => d.value.toFixed(2))
    .attr("x", d => xScale(d.category) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.value) - 5)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .attr("fill", "black");
}

// React component that fetches inspection data and renders the chart
function RatingInspectionBarChart({ query }) {
  const containerRef = useRef(null); // Reference to chart container
  const svgRef = useRef(null);       // Reference to SVG element

  useEffect(() => {
    // Do nothing if required elements are not available
    if (!query || !containerRef.current || !svgRef.current) return;

    const encodedQuery = encodeURIComponent(query);

    // Fetch inspection data for selected facility
    fetch(`http://localhost:8000/inspections/${encodedQuery}`)
      .then(res => res.json())
      .then(data => {
        const inspections = data.inspections;

        // Get average inspection score over time
        const scoresData = get_scores(inspections);
        const avgScoreScaled = d3.mean(scoresData.scores) / 100; // Scale from 0–100 to 0–1

        // Get and normalize public rating from 0–5 to 0–1
        const rating = parseFloat(inspections[0].rating) / 5;

        // Get dimensions and render the chart
        const { width, height } = containerRef.current.getBoundingClientRect();
        displayBarChart(svgRef.current, width, height, avgScoreScaled, rating);
      });
  }, [query]); // Re-run effect when query changes

  return (
    <div
      className="chart-container d-flex"
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflowX: "auto" }}
    >
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

export default RatingInspectionBarChart;
