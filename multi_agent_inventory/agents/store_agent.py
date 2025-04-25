import sqlite3
import pandas as pd
import ollama

class StoreAgent:
    def __init__(self, db_path):
        self.db_path = db_path

    def fetch_store_data(self, store_id):
        query = """
        SELECT * FROM inventory_monitoring
        WHERE Store_ID = ?
        """
        with sqlite3.connect(self.db_path, check_same_thread=False) as conn:
            return pd.read_sql_query(query, conn, params=(store_id,))

    def generate_store_report(self, store_id):
        data = self.fetch_store_data(store_id)
        prompt = f"""You're a store operations AI agent.
Here is store inventory data for Store ID {store_id}:

{data.head(10).to_markdown(index=False)}

Provide recommendations for reordering, transfers from warehouse, and stock issues (expiry, low stock).
"""
        response = ollama.chat(
            model='gemma:2b',
            messages=[{"role": "user", "content": prompt}]
        )
        return response['message']['content']
