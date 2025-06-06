# ECS273-Project

## Repo files Description
The repository is organized into two main folders: client and server, representing the frontend and backend of the web application. Inside the client directory, the src/components folder contains all the React components that render different parts of the interactive dashboard. These include components like heatmap.jsx, restaurant_overview.jsx, violations.jsx and more, each responsible for visualizing inspection scores, violation trends, public ratings and summary statistics. The App.jsx file combines all components together and handles user input logic, while app.css and index.css provide styling. The client is configured using Vite with the vite.config.js file. The public/ directory contains static geo-data files like ZIP code boundaries and shapefiles (e.g., ca_california_zip_codes_geo.min.json, la_county_zip_codes.json, los-angeles-county.geojson), which are used by D3.js for rendering the heatmap visualizations.

The server folder contains the FastAPI backend logic. Key Python scripts include main.py, which defines the API routes, predict_score.py which runs the Random Forest model to predict future inspection scores and get_ratings.py, which fetches and processes Google ratings. The import_data.py script is used to import and clean the data stored in health_inspections.csv. Data schema definitions are handled in data_scheme.py. The requirements.txt file lists all Python dependencies required to run the backend. Together, this architecture supports a full-stack application where users can query restaurant data and visualize inspection trends, ratings and predicted scores interactively.

The Prediction&overall_analysis.ipynb have the code for the MSE and R^2 score of the Random forest regression and the code for overall analysis to find what are the most common health code violations across LA County and how do inspection scores generally distribute across restaurants over time.

The preprocess_data.ipynb has 3 sections. The 1st sections handles combining the downloaded inspections and violations datasets into 1 dataset. The 2nd section should be ran once to generate a csv file to store collected ratings, which will be used in get_ratings.csv. The 3rd sections combines the health inspections data with the collected ratings.

## Setup
### Backend
1. Enter `server` directory via `cd server`.
2. Run `python3 requirements.txt` or `pip install -r requirements.txt`
 to download necesasry libraries.
3. Make sure local mongodb is running.
4. Run `python3 import_data.py` or `python import_data.py`, if needed, to setup database.
4. Run `uvicorn main:app --reload --port 8000`.

### Frontend
1. Enter `client` directory via `cd client`.
2. Run `npm install` to install dependencies.
3. run `npm run dev` to start frontend.  

## Search
- Type restaurant name or address(For eg. McDonalds or 7-Eleven), click a location that appears, and then click submit.  
- Unique locations are unique occurrences of (facilityName address, city, state, zip, "USA")

## Execution
Once the frontend is running at http://localhost:5173, the interactive dashboard allows users to explore restaurant inspection data across Los Angeles County. Users can begin by typing a facility name, city, or ZIP code in the search bar (For eg. McDonalds or 7-Eleven). As they type, autocomplete suggestions appear to assist with accurate input. After selecting a restaurant and clicking Submit, the dashboard populates with detailed information about the selected location.

The Facility Overview section presents key statistics, such as the restaurant’s address, average inspection score, Google rating, average letter grade, predicted future inspection score and comparisons with ZIP code and citywide averages. The Heatmap provides a ZIP code-level visualization where users can toggle between two modes—RATING (showing public ratings by ZIP) and VIOLATIONS (showing total violation counts). Hovering over a region reveals exact values, with the selected restaurant’s ZIP code highlighted for context. You can zoom the map with buttons or scrolling.

The Score Trend line graph shows how inspection scores have changed over time for the selected restaurant, while Public Rating vs Inspection Score presents a side-by-side comparison of the scaled public rating (out of 5) and inspection score (out of 100), highlighting discrepancies between customer perception and actual hygiene. The Violation Count Trend line chart displays the number of violations recorded per inspection date, offering insight into changes in compliance. Lastly, the Top Violations Pie Chart shows the distribution of the most common types of violations for the restaurant, with interactive tooltips revealing violation type, count and percentage share.

## Datasets
Dataset: Environmental Health Restaurant and Market Inspections 04/01/2022 to 03/31/2025 https://data.lacounty.gov/datasets/19b6607ac82c4512b10811870975dbdc/about

Dataset: Environmental Health Restaurant and Market Violations 04/01/2022 to 03/31/ 2025 https://data.lacounty.gov/datasets/5eaea9f89b7549ee841da7617d3a9cba/about

Combined, processed dataset is health_inspections.csv located in the server directory.
