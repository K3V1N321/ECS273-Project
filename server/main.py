from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from data_scheme import QueryList, InspectionInfo, InspectionsList, HeatmapTimeData, HeatmapZipData, RatingsData, RatingsDataList, ScoresData
from rapidfuzz import process, fuzz
from typing import List
from collections import defaultdict
from datetime import datetime

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.health_inspections # please replace the database name with stock_[your name] to avoid collision at TA's side
            
app = FastAPI(
    title="Health inspection tracking API",
    summary="An aplication tracking health inspections"
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/queryList", 
         response_model=QueryList
    )
async def get_query_list() -> QueryList:
    """
    Get the list of stocks from the database
    """
    queryCollection = db.get_collection("query")
    queriesList = await queryCollection.find_one()
    
    return QueryList(**queriesList)

@app.get("/inspections/{query}", 
         response_model=InspectionsList
    )
async def get_inspections(query: str) -> InspectionsList:
    """
    Get the list of stocks from the database
    """
    inspectionCollection = db.get_collection("inspection")
    query = query.strip()
    inspectionsCursor = inspectionCollection.find({"query": query})
    inspectionsList = {"query": query, "inspections": []}
    async for inspection in inspectionsCursor:
        inspectionsList["inspections"].append(InspectionInfo(**inspection))
    
    return InspectionsList(**inspectionsList)

@app.get("/autocomplete/{query}",
         response_model=list[str]
    )
async def get_autocomplete(query: str) -> list[str]:
    """
    Get autocomplete options for search query
    """
    queryCollection = db.get_collection("query")
    queriesList = await queryCollection.find_one()
    queriesList = queriesList["query"]
    
    results = process.extract(query = query.upper(), choices = queriesList, scorer = fuzz.WRatio, limit = 5)
    autocompletes = []
    for result in results:
        autocompletes.append(result[0])

    return autocompletes

@app.get("/heatmap/time", response_model=List[HeatmapTimeData])
async def get_heatmap_time():
    inspectionCollection = db.get_collection("inspection")
    cursor = inspectionCollection.find()
    violations_by_date = defaultdict(int)
    
    async for doc in cursor:
        date_str = doc["date"]
        date_obj = datetime.strptime(date_str, "%m/%d/%Y")
        key = date_obj.strftime("%Y-%m")
        violations_by_date[key] += len(doc.get("violations", []))
    
    result = [HeatmapTimeData(month=k, violation=v) for k, v in violations_by_date.items()]
    return result

@app.get("/heatmap/zipcode", response_model=List[HeatmapZipData])
async def get_heatmap_zip():
    inspectionCollection = db.get_collection("inspection")
    cursor = inspectionCollection.find()
    violations_by_zip = defaultdict(int)
    
    async for doc in cursor:
        address = doc.get("address", "")
        try:
            zip_code = address.split(",")[-2].strip().split(" ")[-1]
        except IndexError:
            zip_code = "unknown"
        violations_by_zip[zip_code] += len(doc.get("violations", []))
    
    result = [HeatmapZipData(zipCode=k, violation=v) for k, v in violations_by_zip.items()]
    return result

@app.get("/ratings", response_model = RatingsDataList)
async def get_ratings() -> RatingsDataList:
    ratingsCollection = db.get_collection("ratings")
    ratingsData = await ratingsCollection.find_one()
    zips = ratingsData["zips"]
    ratings = ratingsData["ratings"]
    counts = ratingsData["counts"]
    
    ratingsData = []
    for i in range(len(zips)):
        data = {"zip": zips[i], "rating": ratings[i], "count": counts[i]}
        data = RatingsData(**data)
        ratingsData.append(data)
    
        
    ratingsData = {"ratingsData": ratingsData}
    return RatingsDataList(**ratingsData)

@app.get("/scores/{query}", response_model = ScoresData)
async def get_scores(query) -> ScoresData:
    scoresCollections = db.get_collection("scores")
    scoresData = await scoresCollections.find_one({"query": query})
        
    return ScoresData(**scoresData)
    