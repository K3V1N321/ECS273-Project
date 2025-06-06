import * as d3 from "d3";

let timer;

export function autocomplete(query) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const autocompletesList = d3.select("#autocompletes");
    autocompletesList.selectAll("*").remove();
    autocompletesList.style("display", "block");

    if (query.length > 0) {
      fetch("http://localhost:8000/autocomplete/" + query)
        .then((response) => response.json())
        .then((result) => {
          for (const autocomplete of result) {
            autocompletesList
              .append("li")
              .text(autocomplete)
              .style("color", "black")
              .style("padding", "8px")
              .style("cursor", "pointer")
              .style("background-color", (_, i) => i % 2 === 0 ? "#f9f9f9" : "#ffffff")
              .on("click", () => {
                const parts = autocomplete.split(",");
                d3.select("#facility").property("value", parts[0].trim());
                d3.select("#city").property("value", parts[1]?.trim() || "");
                d3.select("#statezip").property("value", parts[2]?.trim() || "");
                d3.select("#country").property("value", parts[3]?.trim() || "");

                // clear list and hide
                autocompletesList.selectAll("*").remove();
                autocompletesList.style("display", "none");
              });
          }
        });
    }
  }, 400);
}
