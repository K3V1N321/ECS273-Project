// Import necessary modules and components
import { autocomplete } from "./components/search";
import "./app.css";
import React, { useState } from "react";
import RestaurantOverview from "./components/restaurant_overview.jsx";
import Heatmap from './components/heatmap';
import ScoreTrend from "./components/score_trend.jsx";
import RatingInspectionBarChart from "./components/rating_inspection_bar_chart.jsx";
import ViolationsPieChart from "./components/violations.jsx";
import ViolationDistributionChart from "./components/violation_pie_chart.jsx";

function App() {
  // State to track ZIP code to highlight on heatmap
  const [highlightZip, setHighlightZip] = useState("");
  // State to hold the search query
  const [query, setQuery] = useState("");

  // Handles search form submission
  const handleSearchSubmit = () => {
    const facility = document.getElementById("facility").value.trim();
    const city = document.getElementById("city").value.trim();
    const statezip = document.getElementById("statezip").value.trim();
    const country = document.getElementById("country").value.trim();

    const newQuery = `${facility}, ${city}, ${statezip}, ${country}`;
    const zip = (statezip.match(/\b\d{5}\b/) || [""])[0]; // Extract ZIP if present

    // Update states
    setHighlightZip(zip);
    setQuery(newQuery);

    // Fill combined input and hide autocomplete dropdown
    document.getElementById("search").value = newQuery;
    const ac = document.getElementById("autocompletes");
    ac.innerHTML = "";
    ac.style.display = "none";
  };

  // Clears all form inputs and resets the dashboard
  const handleClearAll = () => {
    ["facility", "city", "statezip", "country", "search"].forEach(id => {
      document.getElementById(id).value = "";
    });
    setHighlightZip("");
    setQuery("");
    const ac = document.getElementById("autocompletes");
    ac.innerHTML = "";
    ac.style.display = "none";
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header and Search Form */}
      <header className="bg-zinc-400 text-white p-2">
        <h2 className="text-2xl mb-2">Dining Safety: Predicting and Visualizing Restaurants in LA</h2>
        
        {/* Search Form Inputs */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 autocomplete-wrapper relative">
            <input
              className="bg-white text-black p-1 rounded col-span-2"
              id="facility"
              type="text"
              placeholder="Facility"
              onChange={(e) => autocomplete(e.target.value)}
            />
            <input className="bg-white text-black p-1 rounded" id="city" type="text" placeholder="City" onChange={(e) => autocomplete(e.target.value)} />
            <input className="bg-white text-black p-1 rounded" id="statezip" type="text" placeholder="State + ZIP" onChange={(e) => autocomplete(e.target.value)} />
            <input className="bg-white text-black p-1 rounded" id="country" type="text" placeholder="Country" onChange={(e) => autocomplete(e.target.value)} />
            
            {/* Autocomplete dropdown */}
            <ul
              id="autocompletes"
              className="bg-white text-black border rounded w-full absolute top-full left-0 z-10 hidden max-h-48 overflow-y-auto shadow-md"
            ></ul>
          </div>

          {/* Submit and Clear buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              id="submit"
              onClick={handleSearchSubmit}
              style={{ backgroundColor: '#2972b6' }}
              className="text-white px-3 py-1 rounded w-32"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="bg-gray-700 text-white px-3 py-1 rounded w-32"
            >
              Clear All
            </button>
            <input id="search" type="text" className="hidden" />
          </div>
        </div>
      </header>

      {/* Main Content Area: Left = Overview/Heatmap, Right = Trends/Charts */}
      <div className="flex flex-row w-full items-stretch" style={{ height: "930px" }}>
        {/* Left side content */}
        <div className="flex flex-col w-1/2">
          {/* Facility Overview */}
          <div className="h-[285px] p-2">
            <h3 className="text-left text-xl">Facility Overview</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <RestaurantOverview query={query} />
            </div>
          </div>

          {/* ZIP Code Heatmap */}
          <div className="h-[895px] p-2">
            <h3 className="text-left text-xl">Average Rating / Total Violations by ZIP Code</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <Heatmap highlightZip={highlightZip} />
            </div>
          </div>
        </div>

        {/* Right side content */}
        <div className="flex flex-col w-1/2">
          {/* Score Trend Line Graph */}
          <div className="h-[355px] p-2">
            <h3 className="text-left text-xl">Score Trend</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <ScoreTrend query={query} />
            </div>
          </div>

          {/* Public Rating vs Inspection Score Comparison */}
          <div className="h-[400px] p-2">
            <h3 className="text-left text-xl">Public Rating vs Inspection Score</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <RatingInspectionBarChart query={query} />
            </div>
          </div>

          {/* Violation Count Trend (Pie Chart) */}
          <div className="h-[420px] p-2">
            <h3 className="text-left text-xl">Violation Count Trend</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <ViolationsPieChart query={query} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Top Violation Types */}
      <div className="p-4 mt-4">
        <h3 className="text-left text-xl mb-2">Top Violations</h3>
        <div className="border-2 border-gray-300 rounded-xl" style={{ height: "400px" }}>
          <ViolationDistributionChart query={query} />
        </div>
      </div>
    </div>
  );
}

export default App;
