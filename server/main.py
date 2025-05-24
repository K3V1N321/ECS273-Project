from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware
from data_scheme import QueryList

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

@app.get("/query", 
         response_model=QueryList
    )
async def get_stock_list():
    """
    Get the list of stocks from the database
    """
    query_collections = db.get_collection("query")
    queries_list = await query_collections.find_one()
    return QueryList(**queries_list)
