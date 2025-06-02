import { autocomplete } from "./components/search";
import "./app.css";
import RestaurantOverview from "./components/restaurant_overview.jsx"
import Heatmap from './components/heatmap';
import ScoreTrend from "./components/score_trend.jsx"
import RatingInspectionBarChart from "./components/rating_inspection_bar_chart.jsx";
import ViolationsPieChart from "./components/violations.jsx";

function App() {
  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex justify-between items-center">
        <h2 className="text-left text-2xl">Health Inspections</h2>
        <form>
          <input className = "bg-white text-black p-1 w-100 rounded" id = "search" type = "text" placeholder = "Search" onInput = {(event) => autocomplete(event.target.value)}></input>
          <ul className = "bg-white text-black w-100" id = "autocompletes"></ul>
          <button type = "button" className = "bg-blue-600 text-white px-3 py-1 rounded" id = "submit">Submit</button>
        </form>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-1/2">

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl">Facility Overview</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <RestaurantOverview/>
            </div>
          </div>

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">Average Rating / Total Violations by ZIP Code</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <Heatmap/>
            </div>
          </div>
          
        </div>

        <div className="flex flex-col w-1/2">

          <div className="h-1/3 p-2">
            <h3 className="text-left text-xl">Score Trend</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <ScoreTrend/>
            </div>
          </div>
          
          <div className="h-1/3 p-2">
            <h3 className="text-left text-xl h-[2rem]">Public Rating vs Inspection Score</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <RatingInspectionBarChart/>
            </div>  
          </div>

          <div className="h-1/3 p-2">
            <h3 className="text-left text-xl h-[2rem]">Violation Trend / Top Violations</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <ViolationsPieChart/>
              {/* <p className="text-center text-gray-500 mt-20">Empty View 5</p> */}
            </div>
          </div>

        </div>
        
      </div>
    </div>
  )
}

export default App;
