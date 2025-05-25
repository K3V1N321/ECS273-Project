# ECS273-Project

## Setup
### Backend
1. Enter `server` directory via `cd server`.
2. Extract the health_inspections.zip file to get "health_inspections.csv" dataset.
3. Run `python3 requirements.txt` to download necesasry libraries.
3. Make sure local mongodb is running.
4. Run `python3 import_data.py`, if needed, to setup database.
4. Run `uvicorn main:app --reload --port 8000`.

### Frontend
1. Enter `client` directory via `cd client`.
2. Run `npm install` to install dependencies.
3. run `npm run dev` to start frontend.  

## Search
- Type restaurant name or address, click a location that appears, and then click submit.  
- Unique locations are unique occurrences of (facilityName address, city, state, zip, "USA")