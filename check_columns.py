import sqlite3

conn = sqlite3.connect('database/inventory.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(demand_forecasting)")
columns = cursor.fetchall()

print("📋 Columns in 'demand_forecasting' table:")
for col in columns:
    print(f"- {col[1]}")
