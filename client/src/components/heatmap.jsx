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

  useEffect(() => {
    if (mode === "rating") {
      fetch("http://localhost:8000/ratings/map")
        .then((res) => res.json())
        .then((data) => {
          const map = {};
          const ratingsData = data["ratingsData"];
          for (const d of ratingsData) {
            const key = formatZipcode(d["area"]);
            map[key] = d["rating"];
          }
          setRatingsData(map);
          setError(null);
        })
        .catch((e) => setError("ratings data load failed: " + e.message));
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
      .catch((e) => setError("GeoJSON load failed: " + e.message));
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
    const colorScale = d3
      .scaleSequential((t) =>
        d3.interpolateRgb("rgb(126, 0, 0)", "rgb(177, 214, 255)")(t)
      )
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
        const offsetX = 20;
        const offsetY = 20;
        tooltip
          .style("left", event.clientX + offsetX + "px")
          .style("top", event.clientY + offsetY + "px")
          .style("opacity", 1);
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
      .filter(() => false)
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

  const renderRatingsMap = () => {
    const width = 800;
    const height = 600;
    d3.select("#ratings-heatmap").selectAll("*").remove();

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
    const colorScale = d3
      .scaleSequential((t) =>
        d3.interpolateRgb("rgb(177, 214, 255)", "rgb(126, 0, 0)")(t)
      )
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
          .style("left", event.clientX + offsetX + "px")
          .style("top", event.clientY + offsetY + "px")
          .style("opacity", 1);
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
      .filter(() => false)
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
    try {
      if (mode === "rating") renderRatingsMap();
      else if (mode === "zipcode") renderZipcodeHeatmap();
    } catch (e) {
      setError("render error: " + e.message);
    }
  }, [mode, ratingsData, zipcodeData, filteredGeoJson,highlightZip]);

  if (error)
    return (
      <div style={{ color: "red" }}>
        <strong>error:</strong> {error}
      </div>
    );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflowX: "auto",
        overflowY: "auto",
      }}
    >
      <select
        style={{ position: "absolute" }}
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="rating">RATING</option>
        <option value="zipcode">VIOLATIONS</option>
      </select>

      <button
        type="button"
        className="bg-blue-200 text-black px-1.75 py-0.5 rounded"
        id="zoom-in"
        style={{ position: "absolute", top: "515px", left: "120px" }}
      >
        +
      </button>
      <button
        type="button"
        className="bg-blue-200 text-black px-1.75 py-0.5 rounded"
        id="zoom-out"
        style={{ position: "absolute", top: "515px", left: "148px" }}
      >
        -
      </button>
      <button
        type="button"
        className="bg-blue-200 text-black px-1.75 py-0.5 rounded"
        id="reset-zoom"
        style={{ position: "absolute", top: "543px", left: "120px" }}
      >
        Reset Zoom
      </button>

      <div style={{ marginTop: 20, width: "100%", height: "100%" }}>
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
