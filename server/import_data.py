import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.restaurant
data = pd.read_csv("restaurant_data.csv")

if __name__ == "__main__":
    asyncio.run()