import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from tqdm import tqdm

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.health_inspections
data = pd.read_csv("health_inspections.csv", low_memory = False)
# Set missing values as "None"
data["GRADE"] = data["GRADE"].fillna("None")
data["PROGRAM NAME"] = data["PROGRAM NAME"].fillna("None")
data["PROGRAM STATUS"] = data["PROGRAM STATUS"].fillna("None")
data["RATING"] = data["RATING"].fillna("None")
data["RATING"] = data["RATING"].replace("fail", "None")

# Remove facility number of most names, keeping only the name
def clean_name(name):
    endIndex = name.find("#")
    if endIndex != -1:
        name = name[0:endIndex]
    name = name.strip()
    
    return name

# Get and store all possible queries (facility_name address, city, state, zip, USA)
queryCollection = db.get_collection("query")
async def import_queries_to_mongodb():
    queries = data["QUERY"].str.strip()
    queries = queries.unique().tolist()
    await queryCollection.insert_one({"query": queries})

# Store all inspection info in a collection
inspectionCollection = db.get_collection("inspection")
async def import_inspections_to_mongodb():
    documents = []
    for i in tqdm(range(len(data))):
        inspection = data.loc[i].copy().dropna()
        query = inspection["QUERY"].strip()
        
        facilityName = clean_name(inspection["FACILITY NAME"])
        
        address = inspection["FACILITY ADDRESS"].strip()
        city = inspection["FACILITY CITY"].strip()
        state = inspection["FACILITY STATE"].strip()
        zipCode = inspection["FACILITY ZIP"].strip()
        fullAddress = f"{address}, {city}, {state} {zipCode}, USA"
        
        rating = inspection.loc["RATING"]
        
        date = inspection["ACTIVITY DATE"].strip()
        owner = inspection["OWNER NAME"].strip()
        programName = inspection["PROGRAM NAME"].strip()
        peDescription = inspection["PE DESCRIPTION"].strip()
        status = inspection["PROGRAM STATUS"].strip()
        service = inspection["SERVICE DESCRIPTION"].strip()
        score = float(inspection["SCORE"])
        grade = inspection["GRADE"].strip()
        
        violationStatuses = []
        violations = []
        points = []        
        violationColumns = pd.Series(inspection.index)[inspection.index.str.contains(r"\d")].tolist()
        for column in violationColumns:
            if "STATUS" in column:
                violationStatuses.append(inspection[column].strip())
            elif "DESCRIPTION" in column:
                violations.append(inspection[column].strip())
            elif "POINTS" in column:
                points.append(float(inspection[column]))
        
        document = {"query": query, "facilityName": facilityName, "address": fullAddress, "rating": rating,
                    "date": date, "owner": owner, "program": programName, "category": peDescription,
                    "status": status, "service": service, "score": score, "grade": grade,
                    "violationStatuses": violationStatuses, "violations": violations, "points": points}
        documents.append(document)
    
    await inspectionCollection.insert_many(documents = documents)

ratingsCollection = db.get_collection("ratings") 
async def import_ratings_to_mongodb():
    uniqueLocationsData = data.copy().drop_duplicates(subset = ["QUERY"])
    dataWithRating = uniqueLocationsData.loc[uniqueLocationsData["RATING"] != "None"].reset_index()
    zipCodes = dataWithRating["FACILITY ZIP"].unique().tolist()
    averageRatings = []
    counts = []
    for code in zipCodes:
        ratingsData = dataWithRating.loc[dataWithRating["FACILITY ZIP"] == code].copy()
        averageRating = round(ratingsData["RATING"].astype(float).mean(), 1)
        averageRatings.append(averageRating)
        counts.append(len(ratingsData))
        
    ratingsCollection.insert_one({"zips": zipCodes, "ratings": averageRatings, "counts": counts})
    
scoresCollection = db.get_collection("scores") 
async def import_scores_to_mongodb():
    zipCodes = data["FACILITY ZIP"].unique().tolist()
    averageScores = []
    for code in zipCodes:
        zipData = data.loc[data["FACILITY ZIP"] == code].copy()
        averageScore = round(zipData["SCORE"].astype(float).mean(), 1)
        averageScores.append(averageScore)
        
    scoresCollection.insert_one({"zips": zipCodes, "scores": averageScores})

async def run_main():
    await import_queries_to_mongodb()
    await import_inspections_to_mongodb()
    await import_ratings_to_mongodb()
    await import_scores_to_mongodb()
    
if __name__ == "__main__":
    asyncio.run(get_scores())