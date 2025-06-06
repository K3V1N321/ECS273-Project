import { useEffect, useRef } from "react";
import * as d3 from "d3";

// Function to fetch and display facility overview details
function display_overview(query) {
  // Select the container div and clear previous content
  var overviewElement = d3.select("#location-overview");
  overviewElement.selectAll("*").remove();

  var queryUse = encodeURIComponent(query); // Encode the query for URL safety

  // Fetch inspection data for the given facility
  fetch("http://localhost:8000/inspections/" + queryUse)
    .then((response) => response.json())
    .then((result) => {
      var inspections = result["inspections"];
      if (!inspections || inspections.length === 0) return; // Exit if no data

      // Extract basic info
      var name = inspections[0]["facilityName"];
      var address = inspections[0]["address"];
      var rating = inspections[0]["rating"];
      var grades = [];
      var scores = [];

      // Maps to convert between letter grades and numeric values
      const gradeToNum = { F: 0, D: 1, C: 2, B: 3, A: 4 };
      const numToGrade = { 0: "F", 1: "D", 2: "C", 3: "B", 4: "A" };

      // Collect all scores and convert grades to numbers for averaging
      for (const inspection of inspections) {
        scores.push(inspection["score"]);
        grades.push(gradeToNum[inspection["grade"]]);
      }

      // Compute averages
      const averageScore = d3.mean(scores);
      const averageGrade = numToGrade[Math.round(d3.mean(grades))];

      // Display facility name
      overviewElement.append("div")
        .text(name)
        .style("text-align", "center")
        .style("font-size", "1rem")
        .style("font-weight", "bold")
        .style("padding-top", "0.2cm");

      // Display address, rating, average grade and average score
      overviewElement.append("div")
        .html(`Address: <em>${address}</em>`)
        .style("padding-left", "0.3cm");

      overviewElement.append("div")
        .html(`Average Rating: <em>${rating}</em>`)
        .style("padding-left", "0.3cm");

      overviewElement.append("div")
        .html(`Average Grade: <em>${averageGrade}</em>`)
        .style("padding-left", "0.3cm");

      overviewElement.append("div")
        .html(`Average Score: <em>${averageScore.toFixed(1)}</em>`)
        .style("padding-left", "0.3cm");

      // Fetch predicted scores and ZIP/citywide comparisons
      const facilityName = inspections[0]["facilityName"];
      fetch("http://localhost:8000/predict/" + encodeURIComponent(facilityName))
        .then((res) => res.json())
        .then((prediction) => {
          if (prediction && prediction.predicted_future_score) {
            overviewElement.append("div")
              .html(`ZIP Average Score: <em>${prediction.zip_avg.toFixed(2)}</em>`)
              .style("padding-left", "0.3cm");

            overviewElement.append("div")
              .html(`Citywide Average: <em>${prediction.city_avg.toFixed(2)}</em>`)
              .style("padding-left", "0.3cm");

            overviewElement.append("div")
              .html(`Predicted Future Inspection Score: <em>${prediction.predicted_future_score.toFixed(2)}</em>`)
              .style("padding-left", "0.3cm");
          }
        });

      // Fetch inspection frequency data
      fetch("http://localhost:8000/frequency/" + queryUse)
        .then((response) => response.json())
        .then((freqResult) => {
          var totalFrequency = freqResult.total_count || 0;
          overviewElement.append("div")
            .html(`Total Frequency: <em>${totalFrequency}</em>`)
            .style("padding-left", "0.3cm");
        });
    });
}

// React component to show facility overview panel
function RestaurantOverview({ query }) {
  const containerRef = useRef(null); // Ref to container DOM element

  useEffect(() => {
    // Avoid calling if no query or container
    if (!containerRef.current || query.length === 0) return;

    // Trigger display logic on query update
    display_overview(query);
  }, [query]);

  return (
    <div
      className="chart-container d-flex"
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Container where overview content is injected via D3 */}
      <div
        id="location-overview"
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          paddingBottom: "1rem",
        }}
      ></div>
    </div>
  );
}

export default RestaurantOverview;
