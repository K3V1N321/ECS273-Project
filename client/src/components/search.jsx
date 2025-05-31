import * as d3 from "d3";

var timer

export function autocomplete(query) {
    clearTimeout(timer);
    timer = setTimeout(() => {
        var autocompletesList = d3.select("#autocompletes")
        autocompletesList.selectAll("*").remove();
        autocompletesList.style("display", "block");
        if (query.length > 0) {
            fetch("http://localhost:8000/autocomplete/" + query)
            .then((response) => response.json())
            .then((result) => {
                for (const autocomplete of result) {
                    autocompletesList.append("li")
                    .text(autocomplete)
                    .style("color", "black")
                    .on("click", () => {
                        var searchBar = d3.select("#search")
                        searchBar.property("value", autocomplete)
                        searchBar.node().focus()
                    })
                }
            })
        }
    }, 400);
}