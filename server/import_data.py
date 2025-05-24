import asyncio
import pandas as pd
from data_scheme import RestaurantInfo
from motor.motor_asyncio import AsyncIOMotorClient
from tqdm import tqdm

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.health_inspections
data = pd.read_csv("restaurant_data.csv", low_memory = False)
# Set missing values as "None"
data["GRADE"] = data["GRADE"].fillna("None")
data["PROGRAM NAME"] = data["PROGRAM NAME"].fillna("None")
data["PROGRAM STATUS"] = data["PROGRAM STATUS"].fillna("None")

# Remove facility number of most names, keeping only the name
def clean_name(name):
    endIndex = name.find("#")
    if endIndex != -1:
        name = name[0:endIndex]
    name = name.strip()
    
    return name

# Get and store all unique addresses in db (facility_name address, city, state, zip, USA)
queryCollections = db.get_collection("query")
async def import_queries_to_mongodb():
    queries = []
    
    for i in tqdm(range(len(data))):
        inspection = data.loc[i].copy().dropna()
        facility = clean_name(inspection["FACILITY NAME"]).strip()
        address = inspection["FACILITY ADDRESS"].strip()
        city = inspection["FACILITY CITY"].strip()
        state = inspection["FACILITY STATE"].strip()
        zipCode = inspection["FACILITY ZIP"].strip()
        
        fullAddress = f"{facility} {address}, {city}, {state} {zipCode}, USA"
        queries.append(fullAddress)
    queries = set(queries)
    queries = list(queries)
    
    queryCollections.insert_one({"query": queries})   

# Store all inspection info in a collection
inspectionCollection = db.get_collection("inspection")
async def import_inspections_to_mongodb():
    documents = []
    for i in tqdm(range(len(data))):
        inspection = data.loc[i].copy().dropna()
        owner = inspection["OWNER NAME"].strip()
        
        date = inspection["ACTIVITY DATE"].strip()
        facilityName = clean_name(inspection["FACILITY NAME"])
        programName = inspection["PROGRAM NAME"].strip()
        
        address = inspection["FACILITY ADDRESS"].strip()
        city = inspection["FACILITY CITY"].strip()
        state = inspection["FACILITY STATE"].strip()
        zipCode = inspection["FACILITY ZIP"].strip()
        fullAddress = f"{address}, {city}, {state} {zipCode}, USA"
        
        peDescription = inspection["PE DESCRIPTION"].strip()
                
        status = inspection["PROGRAM STATUS"].strip()
        service = inspection["SERVICE DESCRIPTION"].strip()
        score = float(inspection["SCORE"])
        grade = inspection["GRADE"].strip()
        violationStatuses = []
        violations = []
        points = []
        
        inspection = inspection.dropna()
        violationColumns = pd.Series(inspection.index)[inspection.index.str.contains(r"\d")].tolist()
        for column in violationColumns:
            if "STATUS" in column:
                violationStatuses.append(inspection[column].strip())
            elif "DESCRIPTION" in column:
                violations.append(inspection[column].strip())
            elif "POINTS" in column:
                points.append(float(inspection[column]))
        
        document = {"date": date, "owner": owner, "facilityName": facilityName, "programName": programName, "address": fullAddress,
                    "category": peDescription, "status": status, "service": service, "score": score, "grade": grade,
                    "violationStatuses": violationStatuses, "violations": violations, "points": points}
        documents.append(document)
    
    await inspectionCollection.insert_many(documents = documents)
        
if __name__ == "__main__":
    asyncio.run(import_queries_to_mongodb())
    asyncio.run(import_inspections_to_mongodb())