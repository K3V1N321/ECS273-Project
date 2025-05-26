import pandas as pd
import requests

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
        'fields': 'rating',
        'key': API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    return data.get('result', {}).get('rating')

def place_id_main():
    df = pd.read_csv("ratings_data.csv")
    new = df.copy()
    indices = df.loc[df["id"] == "Unknown"].index
    for i in indices:
        print(i)
        if i == 20500:
            break
        place = new.loc[i, "query"]
        id = new.loc[i, "id"]
        if id != "Unknown":
            continue
        pid = get_place_id(place)
        if pid:
           print(f"Place ID for '{place}': {pid}")
           new.loc[i, "id"] = pid
        else:
            print(f"No Place ID found for '{place}'")
            new.loc[i, "id"] = "fail"
        new.to_csv("ratings_data.csv", index = False)

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
        print(f"Rating for '{placeName}': {rating}")
        if rating == None:
            new.loc[i, "rating"] = "fail"
        else:
            new.loc[i, "rating"] = rating
        new.to_csv("ratings_data.csv", index = False)
    
if __name__ == "__main__":
    # Get ids of locations
    place_id_main()
    # Get ratings of locations
    # rating_main()