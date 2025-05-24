from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware
from data_scheme import QueryList, InspectionInfo, InspectionsList

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
    fixQuery = query.replace("_", ",")
    print(fixQuery)
    inspectionsCursor = inspectionCollection.find({"query": fixQuery}).sort("date", 1)
    inspectionsList = {"query": fixQuery, "inspections": []}
    async for inspection in inspectionsCursor:
        inspectionsList["inspections"].append(InspectionInfo(**inspection))
    
    return InspectionsList(**inspectionsList)