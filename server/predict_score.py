import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

# Load data and train model once at startup
df = pd.read_csv("health_inspections.csv", low_memory=False)
df['ACTIVITY DATE'] = pd.to_datetime(df['ACTIVITY DATE'], errors='coerce')
df['SCORE'] = pd.to_numeric(df['SCORE'], errors='coerce')
df['RATING'] = pd.to_numeric(df['RATING'], errors='coerce')

violation_cols = [f'POINTS {i}' for i in range(23)]
df[violation_cols] = df[violation_cols].apply(pd.to_numeric, errors='coerce')
df['total_violation_points'] = df[violation_cols].sum(axis=1)
df['violation_count'] = df[violation_cols].notna().sum(axis=1)

# Train the model
df_past = df[df['ACTIVITY DATE'].dt.year <= 2024]
df_2025 = df[df['ACTIVITY DATE'].dt.year == 2025]
agg_past = df_past.groupby('FACILITY NAME').agg({
    'SCORE': 'mean',
    'RATING': 'mean',
    'total_violation_points': 'mean',
    'violation_count': 'max'
}).reset_index()
agg_2025 = df_2025.groupby('FACILITY NAME').agg({'SCORE': 'mean'}).reset_index()
df_merged = pd.merge(agg_past, agg_2025, on='FACILITY NAME', how='inner', suffixes=('_past', '_2025'))

X_train = df_merged[['SCORE_past', 'RATING', 'total_violation_points', 'violation_count']]
y_train = df_merged['SCORE_2025']

reg = RandomForestRegressor(n_estimators=100, random_state=42)
reg.fit(X_train, y_train)

@router.get("/predict/{facility}")
def predict_score(facility: str):
    print(f"Predicting for: {facility}")
    rest_data = df[df['FACILITY NAME'] == facility]

    if rest_data.empty:
        return JSONResponse(content={"error": "Facility not found"}, status_code=404)

    zip_code = rest_data['FACILITY ZIP'].iloc[0]
    rest_avg = rest_data['SCORE'].mean()
    zip_avg = df[df['FACILITY ZIP'] == zip_code]['SCORE'].mean()
    city_avg = df['SCORE'].mean()

    past_data = rest_data[rest_data['ACTIVITY DATE'].dt.year <= 2024]
    if past_data.empty:
        return JSONResponse(content={"error": "No historical data available for prediction"}, status_code=400)

    features = {
        'SCORE_past': past_data['SCORE'].mean(),
        'RATING': past_data['RATING'].mean(),
        'total_violation_points': past_data['total_violation_points'].mean(),
        'violation_count': past_data['violation_count'].max()
    }

    X = pd.DataFrame([features])
    pred_score = reg.predict(X)[0]

    return {
        "facility": facility,
        "average_score": round(rest_avg, 2),
        "zip_avg": round(zip_avg, 2),
        "city_avg": round(city_avg, 2),
        "predicted_future_score": round(pred_score, 2)
    }
