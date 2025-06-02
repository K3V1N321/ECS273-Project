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

function displayBarChart(svgElement, width, height, scoresData, rating) {
    console.log(scoresData);
    console.log(rating);
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
        console.log(countyRating)
        console.log(countyScore)
        // var queryUse = encodeURIComponent(query);
        // fetch("http://localhost:8000/inspections" + queryUse)
        // .then((response) => response.json())
        // .then((data) => {
        //     var inspections = data["inspections"];
        //     var scoresData = get_scores(inspections);
        //     var rating = inspections[0]["rating"];

        //     const {width, height} = containerRef.current.getBoundingClientRect();
        //     displayBarChart(svgRef.current, width, height, scoresData, rating);
        // })
    }, [query])



    return (
        <div className = "chart-container d-flex" ref = {containerRef} style = {{width: "100%", height: "100%", overflowX: "auto"}}>
            <svg id = "rating-inspection-bar" ref={svgRef} width = "100%" height = "100%"></svg>
        </div>
    );

}

export default RatingInspectionBarChart