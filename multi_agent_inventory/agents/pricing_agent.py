import sqlite3
import pandas as pd
import ollama
import json

class PricingAgent:
    def __init__(self, db_path):
        self.db_path = db_path

    def fetch_pricing_data(self, product_id):
        query = """
        SELECT * FROM pricing_optimization
        WHERE Product_ID = ?
        """
        with sqlite3.connect(self.db_path, check_same_thread=False) as conn:
            return pd.read_sql_query(query, conn, params=(product_id,))

    def optimize_prices(self, product_id):
        data = self.fetch_pricing_data(product_id)

        # Return early if data is empty
        if data.empty:
            return {"error": "No pricing data found for this product."}

        # Prepare prompt for LLM
        prompt = f"""
You're a pricing strategist AI.
Return your answer as a JSON array with keys: 
Product, Price, Competitor Prices, Discounts, Return Rate, Price Adjustment.

Here is pricing data for Product ID {product_id}:

{data.head(10).to_markdown(index=False)}

Now suggest optimized prices.
"""

        response = ollama.chat(
            model='gemma:2b',
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse and return JSON response
        try:
            parsed = json.loads(response['message']['content'])
            return parsed
        except Exception as e:
            return {
                "error": f"Failed to parse response as JSON: {str(e)}",
                "raw": response['message']['content']
            }
