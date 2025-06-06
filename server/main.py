from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from data_scheme import QueryList, InspectionInfo, InspectionsList, HeatmapTimeData, HeatmapZipData, RatingsData, RatingsDataList, ScoresData,IntervalData, FrequencyData
from rapidfuzz import process, fuzz
from typing import List
from collections import defaultdict
from datetime import datetime
from fastapi import HTTPException
from predict_score import router as prediction_router

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.health_inspections 
            
app = FastAPI(
    title="Health inspection tracking API",
    summary="An aplication tracking health inspections"
)
app.include_router(prediction_router)

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
    Get the list of loactions from the database
    """
    queryCollection = db.get_collection("query")
    queriesList = await queryCollection.find_one()
    
    return QueryList(**queriesList)

@app.get("/inspections/{query}", 
         response_model=InspectionsList
    )
async def get_inspections(query: str) -> InspectionsList:
    """
    Get the list of inspections from the database
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

@app.get("/ratings/", response_model = RatingsDataList)
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

@app.get("/ratings/{query}", response_model = RatingsDataList)
async def get_ratings(query) -> RatingsDataList:
    ratingsCollection = db.get_collection("ratings")
    ratingsDataList = []
    
    if query == "map":
        ratingsDataCursor = ratingsCollection.find()        
        # Get all ratings per zip code
        async for data in ratingsDataCursor:            
            if data["area"] == "county":
                continue
            
            ratingsData = RatingsData(**data)
            ratingsDataList.append(ratingsData)
        ratingsDataList = {"ratingsData": ratingsDataList}
        return RatingsDataList(**ratingsDataList)
    else:
        ratingsData = await ratingsCollection.find_one({"area": query})
        ratingsData = RatingsData(**ratingsData)
        ratingsDataList.append(ratingsData)
        ratingsDataList = {"ratingsData": ratingsDataList}
        return RatingsDataList(**ratingsDataList)
         

@app.get("/scores/{query}", response_model = ScoresData)
async def get_scores(query) -> ScoresData:
    scoresCollections = db.get_collection("scores")
    scoresData = await scoresCollections.find_one({"query": query})
        
    return ScoresData(**scoresData)




@app.get("/frequency/{query}", response_model=FrequencyData)
async def get_inspection_frequency(query: str):
    frequencyCollection = db.get_collection("inspection")
    cursor = frequencyCollection.find({"query": query})
    
    inspections_by_year = defaultdict(set)  

    async for doc in cursor:
        date_str = doc.get("date")
        if not date_str:
            continue
        try:
            date_obj = datetime.strptime(date_str, "%m/%d/%Y")
            year_key = date_obj.strftime("%Y")
            inspections_by_year[year_key].add(date_obj.date())  
        except ValueError:
            continue

    # Convert set lengths into counts
    sorted_data = sorted((k, len(v)) for k, v in inspections_by_year.items())
    frequency = [{"year": k, "count": v} for k, v in sorted_data]
    total_count = sum(v for _, v in sorted_data)

    return FrequencyData(query=query, frequency=frequency, total_count=total_count)

