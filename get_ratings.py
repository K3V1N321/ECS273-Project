import pandas as pd
import requests
import time
from tqdm import tqdm

# Make sure have ran section in preprocess_data.ipynb to create a "ratings_data.csv" file.
# ratings_data.csv is needed to run this code.

# Replace with Google API key
API_KEY = "key"
  
# Get id of restaurant  
def get_place_id(place_name):
    endpoint_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    
    params = {
        "input": place_name,
        "inputtype": "textquery",
        "fields": "place_id",  # request place_id only
        "key": API_KEY
    }
    
    response = requests.get(endpoint_url, params=params)
    resp_json = response.json()
    
    if resp_json.get("candidates"):
        place_id = resp_json["candidates"][0]["place_id"]
        return place_id
    else:
        return None

# Get rating of restaurant  
def get_rating(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'rating',
        'key': API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    rating = data.get('result', {}).get('rating')
    return rating
    
if __name__ == "__main__":
    df = pd.read_csv("ratings_data.csv")
    new = df.copy()
    
    # Get 1000 unknown ratinhs
    indices = df.loc[df["rating"] == "Unknown"].index
    indicesUse = indices[0:1000]
    for i in tqdm(indicesUse):
        place = new.loc[i, "query"]
        id = new.loc[i, "id"]
        if id == "fail":
            continue
        id = get_place_id(place)
        time.sleep(1)
        if id:
           print(f"Place ID for '{place}': {id}")
           new.loc[i, "id"] = id
           rating = get_rating(id)
           new.loc[i, "rating"] = rating           
           print(f"Rating for '{place}': {rating}")
           time.sleep(1)
        else:
            print(f"No Place ID found for '{place}'")
            new.loc[i, "id"] = "fail"
            new.loc[i, "rating"] = "fail"
        new.to_csv("ratings_data.csv", index = False)