import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

function display_overview(query) {
    var overviewElement = d3.select("#location-overview");
    overviewElement.selectAll("*").remove();
    var queryUse = encodeURIComponent(query)
    fetch("http://localhost:8000/inspections/" + queryUse)
    .then((response) => response.json())
    .then((result) => {
        var inspections = result["inspections"]
    
        var name = inspections[0]["facilityName"]
        var address = inspections[0]["address"]
        var rating = inspections[0]["rating"]
        var grades = []
        var scores = []

        const gradeToNum = {"F": 0, "D": 1, "C": 2, "B": 3, "A": 4}
        const numToGrade = {0: "F", 1: "D", 2: "C", 3: "B", 4: "A"}

        for (const inspection of inspections) {
            scores.push(inspection["score"])
            grades.push(gradeToNum[inspection["grade"]])
        }
        const averageScore = d3.mean(scores)
        const averageGrade = numToGrade[Math.round(d3.mean(grades))]
        
        overviewElement.append("div")
        .text(name)
        .style("text-align", "center")
        .style("font-size", "1rem")
        .style("font-weight", "bold")

        overviewElement.append("div")
        .text("Address: " + address)
        .style("text-align", "left")
        .style("font-size", "1rem")

        overviewElement.append("div")
        .text("Average Rating: " + rating)
        .style("text-align", "left")
        .style("font-size", "1rem")

        overviewElement.append("div")
        .text("Average Grade: " + averageGrade)
        .style("text-align", "left")
        .style("font-size", "1rem")

        overviewElement.append("div")
        .text("Average Score: " + String(averageScore.toFixed(1)))
        .style("text-align", "left")
        .style("font-size", "1rem")

    fetch("http://localhost:8000/frequency/" + queryUse)
    .then((response) => response.json())
    .then((freqResult) => {
        var totalFrequency = freqResult.total_count || 0;
        overviewElement.append("div")
        .text("Total Frequency: " + totalFrequency)
        .style("text-align", "left")
        .style("font-size", "1rem")
        })
        
    })
}

function RestaurantOverview() {
    const containerRef = useRef(null);
    var [query, setQuery] = useState("");
    
    useEffect(() => {
        d3.select("#submit").on("click.overview", () => {
            var query = d3.select("#search").property("value")
            var autocompleteElements = d3.select("#autocompletes").selectAll("li").nodes()
            var autocompletes = []

            if (!autocompleteElements) {
                return
            }

            for (const element of autocompleteElements) {
                autocompletes.push(element.textContent)
            }

            if (autocompletes.includes(query)) {
                setQuery(query)
                var autocompletesList = d3.select("#autocompletes")
                var isVisiable = autocompletesList.style("display") === "block"
                if (isVisiable) {
                    autocompletesList.style("display", "none")
                }
            }
        })
    }, []);

    useEffect(() => {
        if (!containerRef.current || query.length == 0) {
            return;
        } 

        display_overview(query)
    }, [query])

    return (
        <div className = "chart-container d-flex" ref = {containerRef} style = {{width: "100%", height: "100%"}}>
            <div id = "location-overview" style = {{width: "100%", height: "100%", overflowY: "auto"}}></div>
        </div>
    );
}

export default RestaurantOverview

