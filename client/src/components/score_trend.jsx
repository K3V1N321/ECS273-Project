import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const margin = { left: 40, right: 20, top: 20, bottom: 60 }

function get_scores(inspections) {
    var scores = {};
    for (const inspection of inspections) {
        const date = inspection["date"];
        const score = Number(inspection["score"]);
        if (date in scores) {
            scores[date].push(score);
        }
        else {
            scores[date] = [score];
        }
    }

    var scoresData = {"dates": [], "scores": []};
    for (const date in scores) {
        const averageScore = d3.mean(scores[date])
        scoresData["dates"].push(date)
        scoresData["scores"].push(averageScore)
    }

    return scoresData
}

function displayScoreTrend(svgElement, width, height, countyScores, zipScores, facilityScores) {
    var dates = [];
    var scores = [];
    var countyScoresList = []
    var zipScoresList = []
    var facilityScoresList = []
    
    console.log(countyScores)
    console.log(zipScores)
    console.log(facilityScores)
    const parseDate = d3.timeParse("%m/%d/%Y");

    for (var i = 0; i < countyScores["dates"].length; i++) {
        const date = parseDate(countyScores["dates"][i]);
        const score = countyScores["scores"][i]
        dates.push(date);
        scores.push(score);
        countyScoresList.push({"date": date, "score": score})
    }

    for (var i = 0; i < zipScores["dates"].length; i++) {
        const date = parseDate(zipScores["dates"][i]);
        const score = zipScores["scores"][i]
        dates.push(date);
        scores.push(score);
        zipScoresList.push({"date": date, "score": score})
    }

    for (var i = 0; i < facilityScores["dates"].length; i++) {
        const date = parseDate(facilityScores["dates"][i]);
        const score = countyScores["scores"][i]
        dates.push(date);
        scores.push(score);
        facilityScoresList.push({"date": date, "score": score})
    }

    const allData = {"county": countyScoresList, "zip": zipScoresList, "facility": facilityScoresList};

    
    var xExtents = d3.extent(dates);
    var yExtents = d3.extent(scores);


    const svg = d3.select(svgElement);
    const minXAxisWidth =  dates.length * 100;
    const xAxisWidth = d3.max([width, minXAxisWidth]);
    svg.attr("width", xAxisWidth);
    svg.selectAll("*").remove()

    var xScale = d3.scaleTime()
    .rangeRound([margin.left, xAxisWidth - margin.right - 20])
    .domain(xExtents)

    var yScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain(yExtents)

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    var plot = svg.append("g")
    .attr("id", "score-plot-content");
    
    const xAxisGroup = plot.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickValues(dates).tickFormat(d3.timeFormat("%m/%d/%Y")))

    const yAxisGroup = plot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

    const color = d3.scaleOrdinal(d3.schemeObservable10)

    const line = d3.line()
    .x((data) => xScale(data["date"]))
    .y((data) => yScale(data["score"]))

    const linesGroup = plot.append("g")
    var lines = []
    for (const scoreType in allData) {
        lines.push(linesGroup.append("path")
        .datum(allData[scoreType])
        .attr("fill", "none")
        .attr("stroke", color(scoreType))
        .attr("stroke-width", 1)
        .attr("d", line))
    }

    const legend = plot.append("g")
    .selectAll(".legend")
    .data(Object.keys(allData))
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (dataType, i) => `translate(${margin.left + 10}, ${margin.top + (i * 10)})`)

    legend.append("rect")
    .attr("x", 0)
    .attr("width", 8)
    .attr("height", 8)
    .attr("fill", (dataType) => color(dataType));

    legend.append("text")
    .attr("x", 10)
    .attr("y", 8)
    .text((dataType) => dataType)
    .attr("font-size", ".8rem");
}

function ScoreTrend() {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    var [query, setQuery] = useState("");
    var [countyScores, setCountScores] = useState({});

    useEffect(() => {
        fetch("http://localhost:8000/scores/county")
        .then((response) => response.json())
        .then((data) => {
            setCountScores(data);
        })
    })

    useEffect(() => {
        d3.select("#submit").on("click.score", () => {
            var query = d3.select("#search").property("value");
            // Get all recommended locations
            var autocompleteElements = d3.select("#autocompletes").selectAll("li").nodes();
            var autocompletes = [];

            if (!autocompleteElements) {
                return;
            }

            for (const element of autocompleteElements) {
                autocompletes.push(element.textContent);
            }

            // If current seeach is one of the recommended locations, change query to be search
            if (autocompletes.includes(query)) {
                setQuery(query)
                var autocompletesList = d3.select("#autocompletes")
                var autocompletesList = d3.select("#autocompletes")
                var isVisiable = autocompletesList.style("display") === "block"
                if (isVisiable) {
                    autocompletesList.style("display", "none")
                }
            }
        })
    }, []);

    useEffect(() => {
        if (!containerRef.current || !svgRef.current || query.length == 0) {
            return;
        }
        const queryParts = query.split(",");
        const zipCode = queryParts[2].split(" ")[2];
        console.log(query)
        console.log(zipCode)
        fetch("http://localhost:8000/scores/" + zipCode)
        .then((response) => response.json())
        .then((zipScores) => {
            console.log(countyScores)
            console.log(zipScores)
            var queryUse = encodeURIComponent(query);
            fetch("http://localhost:8000/inspections/" + queryUse)
            .then((response) => response.json())
            .then((data) => {
                var inspections = data["inspections"];
                var facilityScores = get_scores(inspections)

                const {width, height} = containerRef.current.getBoundingClientRect()
                displayScoreTrend(svgRef.current, width, height, countyScores, zipScores, facilityScores);
            })
        })
        
    }, [query])

    

    return (
        <div className = "chart-container d-flex" ref = {containerRef} style = {{width: "100%", height: "100%", overflowX: "auto"}}>
            <svg id = "score-trend" ref={svgRef} width = "100%" height = "100%"></svg>
        </div>
    );
}

export default ScoreTrend