// Code to generate heatmap
import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

function Heatmap({ highlightZip }) {
  const [mode, setMode] = useState("rating");
  const [ratingsData, setRatingsData] = useState({});
  const [zipcodeData, setZipcodeData] = useState({});
  const [zipcodeGeoJson, setZipcodeGeoJson] = useState(null);
  const [laCountyZipcodes, setLaCountyZipcodes] = useState(new Set());
  const [filteredGeoJson, setFilteredGeoJson] = useState(null);
  const [error, setError] = useState(null);
  const tooltipRef = useRef(null);

  function formatZipcode(zip) {
    return zip?.toString().trim() || "";
  }
  // Load full California ZIP GeoJSON file
  useEffect(() => {
    fetch("/ca_california_zip_codes_geo.min.json")
      .then((res) => res.json())
      .then((data) => setZipcodeGeoJson(data))
      .catch((e) => setError("GeoJSON load failed: " + e.message));
  }, []);

  useEffect(() => {
    fetch("/la_county_zip_codes.json")
      .then((res) => res.json())
      .then((data) => setLaCountyZipcodes(new Set(data.map(formatZipcode))))
      .catch((e) => setError("LA zipcode load failed: " + e.message));
  }, []);
  // Filter GeoJSON to include only LA County ZIPs
  useEffect(() => {
    if (!zipcodeGeoJson || laCountyZipcodes.size === 0) return;
    const filteredFeatures = zipcodeGeoJson.features.filter((f) =>
      laCountyZipcodes.has(formatZipcode(f.properties.ZCTA5CE10))
    );
    setFilteredGeoJson({ ...zipcodeGeoJson, features: filteredFeatures });
  }, [zipcodeGeoJson, laCountyZipcodes]);
  // Fetch data depending on selected mode: rating or violation
  useEffect(() => {
    if (mode === "rating") {
      fetch("http://localhost:8000/ratings/map")
        .then((res) => res.json())
        .then((data) => {
          const map = {};
          data.ratingsData.forEach((d) => {
            map[formatZipcode(d.area)] = d.rating;
          });
          setRatingsData(map);
        })
        .catch((e) => setError("Ratings data load failed: " + e.message));
    } else if (mode === "zipcode") {
      fetch("http://localhost:8000/heatmap/zipcode")
        .then((res) => res.json())
        .then((data) => {
          const map = {};
          data.forEach((d) => {
            if (d.zipCode) map[formatZipcode(d.zipCode)] = d.violation;
          });
          setZipcodeData(map);
        })
        .catch((e) => setError("Zipcode data load failed: " + e.message));
    }
  }, [mode]);

  const renderMap = (dataMap, interpolateFn, valueLabel) => {
    const width = 800;
    const height = 550;
    d3.select("#heatmap").selectAll("*").remove();

    if (!filteredGeoJson) return;

    const svg = d3
      .select("#heatmap")
      .attr("width", width)
      .attr("height", height)
      

    const projection = d3
      .geoMercator()
      .fitExtent([[20, 20], [width - 20, height - 20]], filteredGeoJson);

    const path = d3.geoPath(projection);
    const values = Object.values(dataMap);
    const maxVal = values.length ? d3.max(values) : 1;

    const colorScale = d3
      .scaleSequential((t) => d3.interpolateRgb(...interpolateFn)(t))
      .domain([maxVal, 0]);

    const tooltip = d3.select(tooltipRef.current);
    const mapGroup = svg.append("g").attr("id", "map-group");

    mapGroup
      .selectAll("path")
      .data(filteredGeoJson.features)
      .join("path")
      .attr("d", path)
      .attr("stroke", (d) =>
        formatZipcode(d.properties.ZCTA5CE10) === highlightZip ? "yellow" : "#333"
      )
      .attr("stroke-width", (d) =>
        formatZipcode(d.properties.ZCTA5CE10) === highlightZip ? 3 : 0.7
      )
      .attr("fill", (d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        const val = dataMap[zip];
        return val !== undefined ? colorScale(val) : "#eee";
      })
      .on("mouseenter", (event, d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        const val = dataMap[zip] ?? "no data";
        d3.select(event.currentTarget).attr("stroke-width", 2);
        tooltip
          .style("opacity", 1)
          .html(`<strong>Zipcode:</strong> ${zip}<br/><strong>${valueLabel}:</strong> ${val}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseleave", (event, d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        if (zip !== highlightZip) {
          d3.select(event.currentTarget).attr("stroke-width", 0.7);
        }
        tooltip.style("opacity", 0);
      });

    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    d3.select("#zoom-in").on("click", () => {
      svg.transition().call(zoom.scaleBy, 1.2);
    });
    d3.select("#zoom-out").on("click", () => {
      svg.transition().call(zoom.scaleBy, 0.8);
    });
    d3.select("#reset-zoom").on("click", () => {
      svg.transition().call(zoom.transform, d3.zoomIdentity);
    });
  };

  useEffect(() => {
    if (!filteredGeoJson) return;
    if (mode === "rating") {
      renderMap(ratingsData, ["rgb(177, 214, 255)", "rgb(126, 0, 0)"], "Average Rating");
    } else if (mode === "zipcode") {
      renderMap(zipcodeData, ["rgb(126, 0, 0)", "rgb(177, 214, 255)"], "Violations");
    }
  }, [mode, ratingsData, zipcodeData, filteredGeoJson, highlightZip]);

  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label htmlFor="mode-select" className="text-sm font-medium"> </label>
          <select
            id="mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-[#e8edf5] text-black border border-gray-300 px-2 py-1 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="rating">RATING</option>
            <option value="zipcode">VIOLATIONS</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-[#e8edf5] text-black border border-gray-300 px-2 py-1 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            id="zoom-in"
          >
            +
          </button>
          <button
            type="button"
            className="bg-[#e8edf5] text-black border border-gray-300 px-2 py-1 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            id="zoom-out"
          >
            -
          </button>
          <button
            type="button"
            className="bg-[#e8edf5] text-black border border-gray-300 px-2 py-1 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            id="reset-zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ width: "100%", height: "550px", border: "none", outline: "none", background: "transparent"  }}>
        <svg id="heatmap" style={{ width: "100%", height: "100%", border: "none", outline: "none", background: "transparent" }}></svg>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          textAlign: "center",
          minWidth: "60px",
          padding: "4px 8px",
          fontSize: "12px",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          borderRadius: "4px",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.3s",
          userSelect: "none",
          whiteSpace: "nowrap",
          zIndex: 1000,
        }}
      ></div>
    </div>
  );
}

export default Heatmap;
