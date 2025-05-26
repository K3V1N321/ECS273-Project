import pandas as pd
import requests
import time
from tqdm import tqdm

API_KEY = "AIzaSyB6U9fR1Uk1OGK5NTra1oClMvIcaoQpPp4"
    
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
    
def get_rating(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'rating,reviews',
        'key': API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    rating = data.get('result', {}).get('rating')
    reviews = data.get('result', {}).get('reviews', [])[:5]
    return rating, reviews
    
def rating_main():
    df = pd.read_csv("ratings_data.csv")
    indices = df.loc[df["rating"] == "Unknown"].index
    new = df.copy()
    for i in indices:
        print(i)
        if new.loc[i, "id"] == "Unknown":
            break
        elif new.loc[i, "rating"] != "Unknown":
            continue
        placeName = new.loc[i, "query"]
        id = new.loc[i, "id"]
        if id == "fail" or id == None:
            print(f"{i}, {placeName}, No id")
            new.loc[i, "rating"] = "fail"
            continue
        rating = get_rating(id)
        time.sleep(1)
        print(f"Rating for '{placeName}': {rating}")
        if rating == None:
            new.loc[i, "rating"] = "fail"
        else:
            new.loc[i, "rating"] = rating
        new.to_csv("ratings_data.csv", index = False)
    
if __name__ == "__main__":
    df = pd.read_csv("ratings_data.csv")
    new = df.copy()
    indices = df.loc[df["id"] == "Unknown"].index
    indicesUse = indices[0:1000]
    reviewsSave = []
    for i in tqdm(indicesUse):
        place = new.loc[i, "query"]
        id = new.loc[i, "id"]
        if id != "Unknown":
            continue
        id = get_place_id(place)
        time.sleep(1)
        if id:
           print(f"Place ID for '{place}': {id}")
           new.loc[i, "id"] = id
           rating, reviews = get_rating(id)
           new.loc[i, "rating"] = rating
           for j in range(len(reviews)):
               reviews[j]["query"] = place
           
           reviewsSave.append(reviews)
           print(f"Rating for '{place}': {rating}")
           time.sleep(1)
        else:
            print(f"No Place ID found for '{place}'")
            new.loc[i, "id"] = "fail"
            new.loc[i, "rating"] = "fail"
            reviewsSave.append("fail")
        new.to_csv("ratings_data2.csv", index = False)
        
    reviewsDf = pd.read_csv("reviews.csv")
    for review in reviewsSave:
        if type(review) != list:
            continue
        a = pd.DataFrame(review)
        reviewsDf = pd.concat([reviewsDf, a], axis = 0)
    reviewsDf.to_csv("reviews.csv", index = False)
