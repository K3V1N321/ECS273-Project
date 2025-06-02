import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const margin = { left: 40, right: 20, top: 20, bottom: 60 }

function displayPieChart(svgElement, tooltipElement, width, height, violationCountsData) {
    const radius = d3.min([width, height]) / 2
    const color = d3.scaleOrdinal(d3.schemeCategory10);

   const svg = d3.select(svgElement);
   const pieChartContainer = svg.append("g")
   .attr("transform", `translate(${width / 2}, ${height / 2})`)

   const pieChart = d3.pie()
   .value((data) => data["count"]);

   const arc = d3.arc()
   .innerRadius(0)
   .outerRadius(radius)

   const arcs = pieChartContainer.selectAll(".arc")
   .data(pieChart(violationCountsData))
   .enter()
   .append("g")
   .attr("class", "arc")

   arcs.append("path")
   .attr("d", arc)
   .attr("fill", (data) => color(data["data"]["code"]))

   arcs.append("text")
   .attr("transform", (data) => {
    const [x, y] = arc.centroid(data);
    return `translate(${x - 20}, ${y})`
   })
   .text((data) => data["data"]["code"])

   const tooltip = d3.select(tooltipElement);

   arcs.on("mouseenter", (event, data) => {
    const violation = data["data"]["violation"]
    const count = data["data"]["count"]

    tooltip.style("opacity", 1)
    .html(`<strong>Violation:</strong> ${violation}<br/><strong>Count:</strong> ${count}`);
   })

   arcs.on("mousemove", (event, d) => {
    const offsetX = 20;
    const offsetY = 20;
    const {width, height} = tooltip.node().getBoundingClientRect()
    tooltip.style("left", (event.clientX - width - offsetX) + "px")
    .style("top", (event.clientY + offsetY) + "px")
    .style("opacity", 1);
   })

   arcs.on("mouseleave", (event) => {
    d3.select(event.currentTarget).attr("stroke-width", 0.7);
    tooltip.style("opacity", 0);
   })
}

function ViolationsPieChart() {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    var [query, setQuery] = useState("");

    useEffect(() => {
        d3.select("#submit").on("click.rating_inspection", () => {
            var query = d3.select("#search").property("value");
            // Get all recommended locations
            var autocompleteElements = d3.select("#autocompletes").selectAll("li").nodes();
            var autocompletes = []

            if (!autocompleteElements) {
                return;
            }

            for (const element of autocompleteElements) {
                autocompletes.push(element.textContent);
            }

            // If current search is one of the recommended locations, change query to be search
            if (autocompletes.includes(query)) {
                setQuery(query);
                var autocompletesList = d3.select("#autocompletes");
                var isVisible = autocompletesList.style("display") === "block";
                if (isVisible) {
                    autocompletesList.style("display", "none");
                }
            }
        })
    }, [])

    useEffect(() => {
        if (!containerRef.current || !svgRef.current || query.length == 0) {
            return;
        }
        var queryUse = encodeURIComponent(query);
        fetch("http://localhost:8000/inspections/" + queryUse)
        .then((response) => response.json())
        .then((data) => {
            var inspections = data["inspections"];
            var violationsCounts = {};
            for (const inspection of inspections) {
                const violations = inspection["violations"]
                for (const violation of violations) {
                    if (violation in violationsCounts) {
                        violationsCounts[violation] += 1;
                    }
                    else {
                        violationsCounts[violation] = 1;
                    }
                }
            }
            var violationCountsData = []
            for (const violation in violationsCounts) {
                const violationParts = violation.match(/#\s*([a-zA-Z0-9]+)\.\s*(.+)/)
                const code = "#" + violationParts[1]
                violationCountsData.push({"violation": violation, "code": code, "count": violationsCounts[violation]})
            }
            const {width, height} = containerRef.current.getBoundingClientRect()
            displayPieChart(svgRef.current, tooltipRef.current, width, height, violationCountsData);      
        })
    }, [query])



    return (
        <div className = "chart-container d-flex" ref = {containerRef} style = {{width: "100%", height: "100%", overflowX: "auto"}}>
            <svg id = "violations-pie" ref={svgRef} width = "100%" height = "100%"></svg>

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

export default ViolationsPieChart