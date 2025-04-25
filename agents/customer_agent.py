import sqlite3
import pandas as pd
import ollama

class CustomerAgent:
    def __init__(self, db_path):
        self.db_path = db_path

    def fetch_customer_behavior(self, product_id):
        query = """
        SELECT Customer_Segments, Sales_Quantity, Promotions, External_Factors
        FROM demand_forecasting
        WHERE Product_ID = ?
        """
        with sqlite3.connect(self.db_path, check_same_thread=False) as conn:
            return pd.read_sql_query(query, conn, params=(product_id,))

    def simulate_behavior(self, product_id):
        data = self.fetch_customer_behavior(product_id)
        prompt = f"""You're an AI simulating customer behavior.
Given this data for Product ID {product_id}:

{data.head(15).to_markdown(index=False)}

Simulate how different segments (Premium, Budget, etc.) react to promotions or external factors.
"""
        response = ollama.chat(
            model='gemma:2b',
            messages=[{"role": "user", "content": prompt}]
        )
        return response['message']['content']
