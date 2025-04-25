import sqlite3
import pandas as pd
import ollama

class SupplierAgent:
    def __init__(self, db_path):
        self.db_path = db_path

    def fetch_supplier_demand(self, product_id):
        query = """
        SELECT Product_ID, Store_ID, Stock_Levels, Reorder_Point, Supplier_Lead_Time__days 
        FROM inventory_monitoring 
        WHERE Product_ID = ?
        """
        with sqlite3.connect(self.db_path, check_same_thread=False) as conn:
            return pd.read_sql_query(query, conn, params=(product_id,))

    def plan_supply(self, product_id):
        data = self.fetch_supplier_demand(product_id)
        prompt = f"""You are a supplier AI agent planning upcoming supply shipments.
Here is reorder and supply data for Product ID: {product_id}:

{data.to_markdown(index=False)}

Suggest restocking plan for the warehouse and justify your decision.
"""
        response = ollama.chat(
            model='gemma:2b',
            messages=[{"role": "user", "content": prompt}]
        )
        return response['message']['content']
