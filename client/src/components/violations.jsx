import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const margin = { left: 40, right: 20, top: 20, bottom: 60 }

function displayLineChart(svgElement, tooltipElement, width, height, dateViolationsCount) {
    var dates = []
    var counts = [0]
    var data = []
    var offsetY = 20

    const parseDate = d3.timeParse("%m/%d/%Y");
    for (const date in dateViolationsCount) {
        var dateParsed = parseDate(date)
        var count = dateViolationsCount[date]
        dates.push(dateParsed)
        counts.push(count)
        data.push({"date": dateParsed, "count": count})
    }
    
    var xExtents = d3.extent(dates)
    var yExtents = d3.extent(counts)

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove()
    const minXAxisWidth = dates.length * 200;
    const xAxisWidth = d3.max([width, minXAxisWidth]);
    svg.attr("width", xAxisWidth);

    var xScale = d3.scaleTime()
    .rangeRound([margin.left, xAxisWidth - margin.right - 20])
    .domain(xExtents)

    var yScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain(yExtents)

    var plot = svg.append("g")
    .attr("id", "violations-trend-content")
    .attr("transform", `translate(0, ${offsetY})`)
    
    const xAxisGroup = plot.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickValues(dates).tickFormat(d3.timeFormat("%m/%d/%Y")))

    plot.append("g")
    .attr("transform", `translate(${(xAxisWidth / 2)}, ${height - margin.bottom + offsetY + 10})`)
    .append("text")
    .style("text-anchor", "middle")
    .text("Date (MM/DD/YYYY)")
    .style("font-size", ".8rem");

    const yAxisGroup = plot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

    plot.append("g")
    .attr("transform", `translate(10, ${(height / 2) + offsetY}) rotate(-90)`)
    .append("text")
    .text("Violations Count")
    .style("font-size", ".8rem");

    const line = d3.line()
    .x((data) => xScale(data["date"]))
    .y((data) => yScale(data["count"]))

    const linesGroup = plot.append("g")
    linesGroup.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 1)
    .attr("d", line)
}

function trendBarChart(containerElement, svgElement, tooltipElement, inspections) {
    var dateViolationsCount = {}
    for (const inspection of inspections) {
        const date = inspection["date"];
        const violations = inspection["violations"];
        if (date in dateViolationsCount) {
            dateViolationsCount[date] += violations.length
        }
        else {
            dateViolationsCount[date] = violations.length
        }
    }

    const {width, height} = containerElement.getBoundingClientRect()
    displayLineChart(svgElement, tooltipElement, width, height, dateViolationsCount);
}

function displayPieChart(svgElement, tooltipElement, width, height, violationCountsData) {
    const radius = d3.min([width, height]) / 2
    const customColors = [
    " #58AD96", " #40927C", " #287962", " #466080", " #476992",
    " #466080", " #E7BB76", " #B8693D", "#E79F76", " #2C4F78"
    ];

    const color = d3.scaleOrdinal(customColors);

   const svg = d3.select(svgElement);
   svg.selectAll('*').remove()
   const pieChartContainer = svg.append("g")
   .attr("transform", `translate(${width / 2}, ${height / 2})`)

   const pieChart = d3.pie()
   .value((data) => data["percentage"]);

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
   .attr("fill", (data) => color(data["data"]["violation"]))
   .attr("stroke", "black")
   .attr("stroke-width", 0.5)
   .attr("stroke-opacity", 0.5)

   arcs.append("text")
   .style("font-size", "0.8rem")
   .attr("transform", (data) => {
    const [x, y] = arc.centroid(data);
    return `translate(${x - 20}, ${y})`
   })
   .text((data) => data["data"]["percentage"].toFixed(2) + "%")

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

function distibutionPieChart(containerElement, svgElement, tooltipElement, inspections) {
    var violationsCounts = {};
    var totalCount = 0
    for (const inspection of inspections) {
        const violations = inspection["violations"]
        for (const violation of violations) {
            if (violation in violationsCounts) {
                violationsCounts[violation] += 1;
            }
            else {
                violationsCounts[violation] = 1;
            }
            totalCount += violationsCounts[violation];
        }
    }
    var violationCountsData = []
    for (const violation in violationsCounts) {
        const count = violationsCounts[violation];
        const percentage = (count / totalCount) * 100;
        violationCountsData.push({"violation": violation, "count": count, "percentage": percentage})
    }
    const {width, height} = containerElement.getBoundingClientRect()
    displayPieChart(svgElement, tooltipElement, width, height, violationCountsData);
}

function ViolationsChart() {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    var [query, setQuery] = useState("");
    var [mode, setMode] = useState("trend");

    useEffect(() => {
        d3.select("#submit").on("click.violations", () => {
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
            if (mode === "trend") {
                trendBarChart(containerRef.current, svgRef.current, tooltipRef.current, inspections)
            }
            else if (mode === "distribution") {
                distibutionPieChart(containerRef.current, svgRef.current, tooltipRef.current, inspections)
            }   
        })
    }, [mode, query])

    return (
        <div className = "chart-container d-flex" ref = {containerRef} style = {{width: "100%", height: "100%", overflowX: "auto"}}>
            <select style = {{"position": "absolute"}} onChange={(e) => setMode(e.target.value)}>
                <option value = "trend"> TREND </option>
                <option value = "distribution"> DISTRIBUTION </option>
            </select>
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

export default ViolationsChart