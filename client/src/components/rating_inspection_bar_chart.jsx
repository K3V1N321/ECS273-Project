import React, { useEffect, useState, useRef } from "react";
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

function displayBarChart(svgElement, width, height, averageScore, rating) {
    const categories = ["Inspection", "Rating"]
    const data = [{"category": "Inspection", "value": averageScore}, {"category": "Rating", "value": rating}]
    
    var yExtents = d3.extent([0, 1])

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove()
    const minXAxisWidth = 6 * 100;
    const xAxisWidth = d3.max([width, minXAxisWidth]);
    svg.attr("width", xAxisWidth);

    var xScale = d3.scaleBand()
    .rangeRound([margin.left, xAxisWidth - margin.right - 20])
    .padding(0.3)
    .domain(categories)

    var yScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain(yExtents)

    var plot = svg.append("g")
    .attr("id", "rating-inspection-content")
    
    const xAxisGroup = plot.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickValues(categories))

    plot.append("g")
    .attr("transform", `translate(${(xAxisWidth / 2)}, ${height - margin.bottom + margin.top + 10})`)
    .append("text")
    .style("text-anchor", "middle")
    .text("Type")
    .style("font-size", ".8rem");

    const yAxisGroup = plot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

    plot.append("g")
    .attr("transform", `translate(10, ${(height / 2) + margin.top}) rotate(-90)`)
    .append("text")
    .text("Score")
    .style("font-size", ".8rem");


    plot.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("class", "bar")
    .attr("id", (data) => `bar-${data["category"]}`)
    .attr("x", (data) => xScale(data["category"]))
    .attr("y", (data) => yScale(data["value"]))
    .attr("width", xScale.bandwidth())
    .attr("height", (data) => Math.abs(yScale(0) - yScale(data["value"])))
    .attr("fill", "teal")
}

function RatingInspectionBarChart() {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    var [query, setQuery] = useState("");
    var [countyRating, setCountyRating] = useState({});
    var [countyScore, setCountyScore] = useState({});

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
        fetch("http://localhost:8000/ratings/" + "county")
        .then((response) => response.json())
        .then((data) => {
            setCountyRating(data["ratingsData"][0])
        }) 
    }, [])

    useEffect(() => {
        fetch("http://localhost:8000/ratings/county")
        .then((response) => response.json())
        .then((data) => {
            setCountyRating(data["ratingsData"][0])
        }) 
    }, [])

    useEffect(() => {
        fetch("http://localhost:8000/scores/county")
        .then((response) => response.json())
        .then((data) => {
            setCountyScore({"area": "county", "score": d3.mean(data["scores"])})
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
            var scoresData = get_scores(inspections);
            var rating = inspections[0]["rating"] / 5;
            var averageScoreScaled = d3.mean(scoresData["scores"]) / 100;




            const {width, height} = containerRef.current.getBoundingClientRect();
            displayBarChart(svgRef.current, width, height, averageScoreScaled, rating);
        })
    }, [query])



    return (
        <div className = "chart-container d-flex" ref = {containerRef} style = {{width: "100%", height: "100%", overflowX: "auto"}}>
            <svg id = "rating-inspection-bar" ref={svgRef} width = "100%" height = "100%"></svg>
        </div>
    );

}

export default RatingInspectionBarChart