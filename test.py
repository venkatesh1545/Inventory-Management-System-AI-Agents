import sqlite3
import pandas as pd
db_path='database/inventory.db'
with sqlite3.connect(db_path) as conn:
    df = pd.read_sql_query("SELECT * FROM inventory_monitoring LIMIT 1", conn)
    print(df.columns.tolist())
