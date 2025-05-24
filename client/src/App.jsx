import { useState } from "react";

function App() {
  var [query, setQuesry] = useState("")
  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex justify-between items-center">
        <h2 className="text-left text-2xl">Restaurant</h2>
        <form>
          <input className = "bg-white text-black p-1 rounded" type = "text" placeholder = "Search"></input>
          <button className = "bg-blue-600 text-white px-3 py-1 rounded">Submit</button>
        </form>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-1/2">

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl">View 1 to be replaced by the view title</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <p className="text-center text-gray-500 mt-20">Empty View 1</p>
            </div>
          </div>

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 2 to be replaced by the view title</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <p className="text-center text-gray-500 mt-20">Empty View 2</p>
            </div>
          </div>
          
        </div>

        <div className="flex flex-col w-1/2">

          <div className="h-1/3 p-2">
            <h3 className="text-left text-xl">View 3 to be replaced by the view title</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <p className="text-center text-gray-500 mt-20">Empty View 3</p>
            </div>
          </div>
          
          <div className="h-1/3 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 4 to be replaced by the view title</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <p className="text-center text-gray-500 mt-20">Empty View 4</p>
            </div>  
          </div>

          <div className="h-1/3 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 5 to be replaced by the view title</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <p className="text-center text-gray-500 mt-20">Empty View 5</p>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  )
}

export default App;
