import pandas as pd
import json


df = pd.read_csv('LA_County_ZIP_Codes.csv') 
print(df.columns)
zipcodes_list = df['ZIPCODE'].tolist()

with open('la_county_zip_codes.json', 'w') as f:
    json.dump(zipcodes_list, f, indent=4)
