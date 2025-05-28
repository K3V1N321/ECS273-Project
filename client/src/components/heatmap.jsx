import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

function Heatmap() {
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

  useEffect(() => {
    if (mode === "rating") {
      fetch("http://localhost:8000/ratings")
      .then((res) => res.json())
      .then((data) => {      
        var map = {};
        const ratingsData = data["ratingsData"];
        for (const data of ratingsData) {
          const key = formatZipcode(data["zip"]);
          map[key] = data["rating"];
        }
        setRatingsData(map)
        setError(null);
      })
      .catch((e) => setError("zipcode data load failed: " + e.message));
      }
  }, [mode]);

  useEffect(() => {
    if (mode === "zipcode") {
      fetch("http://localhost:8000/heatmap/zipcode")
        .then((res) => res.json())
        .then((data) => {
          const map = {};
          data.forEach((d) => {
            if (d.zipCode) {
              const key = formatZipcode(d.zipCode);
              map[key] = d.violation;
            }
          });
          setZipcodeData(map);
          setError(null);
        })
        .catch((e) => setError("zipcode data load failed: " + e.message));
    }
  }, [mode]);

  useEffect(() => {
    fetch("/ca_california_zip_codes_geo.min.json")
      .then((res) => res.json())
      .then((data) => {
        setZipcodeGeoJson(data);
        setError(null);
      })
      .catch((e) => setError("GeoJSON load filed: " + e.message));
  }, []);

  useEffect(() => {
    fetch("/la_county_zip_codes.json")
      .then((res) => res.json())
      .then((data) => {
        setLaCountyZipcodes(new Set(data.map(formatZipcode)));
        setError(null);
      })
      .catch((e) => setError("LA zipcode load failed: " + e.message));
  }, []);

  useEffect(() => {
    if (!zipcodeGeoJson || laCountyZipcodes.size === 0) return;
    const filteredFeatures = zipcodeGeoJson.features.filter((f) =>
      laCountyZipcodes.has(formatZipcode(f.properties.ZCTA5CE10))
    );
    setFilteredGeoJson({ ...zipcodeGeoJson, features: filteredFeatures });
  }, [zipcodeGeoJson, laCountyZipcodes]);

  const renderZipcodeHeatmap = () => {
    const width = 800;
    const height = 600;
    d3.select("#zipcode-heatmap").selectAll("*").remove();

    if (!filteredGeoJson || !filteredGeoJson.features) return;

    const svg = d3
      .select("#zipcode-heatmap")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid #ccc");

    const projection = d3
      .geoMercator()
      .fitExtent(
        [
          [20, 20],
          [width - 20, height - 20],
        ],
        filteredGeoJson
      );
    const path = d3.geoPath(projection);

    const values = Object.values(zipcodeData);
    const maxVal = values.length ? d3.max(values) : 1;
    const colorScale = d3.scaleSequential(t => d3.interpolateRgb("rgb(126, 0, 0)", "rgb(177, 214, 255)")(t)).domain([maxVal, 0]);
    const tooltip = d3.select(tooltipRef.current);

    svg
      .append("g")
      .selectAll("path")
      .data(filteredGeoJson.features)
      .join("path")
      .attr("d", path)
      .attr("stroke", "#333")
      .attr("stroke-width", 0.7)
      .attr("fill", (d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        const val = zipcodeData[zip];
        return val !== undefined ? colorScale(val) : "#eee";
      })
      .on("mouseenter", (event, d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        const val = zipcodeData[zip] ?? "no data";

        d3.select(event.currentTarget).attr("stroke-width", 2);

        tooltip
          .style("opacity", 1)
          .html(`<strong>Zipcode:</strong> ${zip}<br/><strong>Violation:</strong> ${val}`);
      })
      .on("mousemove", (event) => {
        const container = d3.select("#zipcode-heatmap").node();
        const rect = container.getBoundingClientRect();
        const offsetX = 20;
        const offsetY = 20;
        tooltip.style("left", (event.clientX + offsetX) + "px")
          .style("top", (event.clientY + offsetY) + "px")
          .style("opacity", 1);
      })
      .on("mouseleave", (event) => {
        d3.select(event.currentTarget).attr("stroke-width", 0.7);
        tooltip.style("opacity", 0);
      });
  };

const renderRatingsMap = () => {
    const width = 800;
    const height = 600;
    d3.select("#ratings-heatmap").selectAll("*").remove();
    console.log

    if (!filteredGeoJson || !filteredGeoJson.features) return;

    const svg = d3
      .select("#ratings-heatmap")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid #ccc");

    const projection = d3
      .geoMercator()
      .fitExtent(
        [
          [20, 20],
          [width - 20, height - 20],
        ],
        filteredGeoJson
      );
    const path = d3.geoPath(projection);
    
    const values = Object.values(ratingsData);
    const maxVal = values.length ? d3.max(values) : 1;
    const colorScale = d3.scaleSequential(t => d3.interpolateRgb("rgb(177, 214, 255)", "rgb(126, 0, 0)")(t)).domain([maxVal, 0]);
    const tooltip = d3.select(tooltipRef.current);

    svg
      .append("g")
      .selectAll("path")
      .data(filteredGeoJson.features)
      .join("path")
      .attr("d", path)
      .attr("stroke", "#333")
      .attr("stroke-width", 0.7)
      .attr("fill", (d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        const val = ratingsData[zip];
        return val !== undefined ? colorScale(val) : "#eee";
      })
      .on("mouseenter", (event, d) => {
        const zip = formatZipcode(d.properties.ZCTA5CE10);
        const val = ratingsData[zip] ?? "no data";

        d3.select(event.currentTarget).attr("stroke-width", 2);

        tooltip
          .style("opacity", 1)
          .html(`<strong>Zipcode:</strong> ${zip}<br/><strong>Average Rating:</strong> ${val}`);
      })
      .on("mousemove", (event) => {
        const offsetX = 20;
        const offsetY = 20;
        tooltip
          .style("position", "absolute")
          .style("left", (event.clientX + offsetX) + "px")
          .style("top", (event.clientY + offsetY) + "px")
          .style("opacity", 1);
      })
      .on("mouseleave", (event) => {
        d3.select(event.currentTarget).attr("stroke-width", 0.7);
        tooltip.style("opacity", 0);
      });
  };

  // const renderTimeHeatmap = () => {
  //   const width = 800;
  //   const height = 200;
  //   const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  //   d3.select("#time-heatmap").selectAll("*").remove();
  //   const svg = d3.select("#time-heatmap").attr("width", width).attr("height", height);
  //   if (!timeData.length) return;

  //   const x = d3
  //     .scaleBand()
  //     .domain(timeData.map((d) => d.month))
  //     .range([margin.left, width - margin.right])
  //     .padding(0.1);
  //   const maxVal = d3.max(timeData, (d) => d.violation);
  //   const y = d3.scaleLinear().domain([0, maxVal]).range([height - margin.bottom, margin.top]);
  //   const colorScale = d3.scaleSequential(t => d3.interpolateRgb("rgb(126, 0, 0)", "rgb(177, 214, 255)")(t)).domain([maxVal, 0]);


  //   svg
  //     .append("g")
  //     .attr("transform", `translate(0,${height - margin.bottom})`)
  //     .call(d3.axisBottom(x))
  //     .selectAll("text")
  //     .attr("transform", "rotate(-45)")
  //     .style("text-anchor", "end");

  //   svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  //   svg
  //     .selectAll(".bar")
  //     .data(timeData)
  //     .join("rect")
  //     .attr("class", "bar")
  //     .attr("x", (d) => x(d.month))
  //     .attr("y", (d) => y(d.violation))
  //     .attr("height", (d) => y(0) - y(d.violation))
  //     .attr("width", x.bandwidth())
  //     .attr("fill", (d) => colorScale(d.violation));
  // };

  useEffect(() => {
    try {
      if (mode === "rating") renderRatingsMap();
      else if (mode === "zipcode") renderZipcodeHeatmap();
    } catch (e) {
      setError("render error: " + e.message);
    }
  }, [mode, ratingsData, zipcodeData, filteredGeoJson]);

  if (error)
    return (
      <div style={{ color: "red" }}>
        <strong>error:</strong> {error}
      </div>
    );

  return (
    <div style={{"width": "100%", "height": "100%", "overflowX": "auto", "overflowY": "auto"}}>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="rating">RATING</option>
        <option value="zipcode">VIOLATIONS</option>
      </select>

      <div style={{ marginTop: 20 }}>
        {mode === "rating" && <svg id="ratings-heatmap"></svg>}
        {mode === "zipcode" && <svg id="zipcode-heatmap"></svg>}
      </div>

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
