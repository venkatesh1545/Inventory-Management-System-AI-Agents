import pandas as pd
import sqlite3
import os

db_path = 'database/inventory.db'
conn = sqlite3.connect(db_path)

# Load CSVs
df_demand = pd.read_csv('data/demand_forecasting.csv')
df_inventory = pd.read_csv('data/inventory_monitoring.csv')
df_pricing = pd.read_csv('data/pricing_optimization.csv')

# Push to SQLite
df_demand.to_sql('demand_forecasting', conn, if_exists='replace', index=False)
df_inventory.to_sql('inventory_monitoring', conn, if_exists='replace', index=False)
df_pricing.to_sql('pricing_optimization', conn, if_exists='replace', index=False)

print("Database loaded successfully ✅")
conn.close()
