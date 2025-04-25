import sqlite3
import ollama
import pandas as pd

class ForecastingAgent:
    def __init__(self, db_path):
        self.db_path = db_path

    def fetch_product_history(self, product_id):
        # Create a new DB connection per request context
        with sqlite3.connect(self.db_path) as conn:
            query = """
            SELECT Date, Sales_Quantity, Price, Promotions, Seasonality_Factors, External_Factors 
            FROM demand_forecasting 
            WHERE Product_ID = ?
            ORDER BY Date
            """
            return pd.read_sql_query(query, conn, params=(product_id,))

    def generate_forecast(self, product_id):
        data = self.fetch_product_history(product_id)

        if data.empty:
            return []

        prompt = f"""You're an AI agent helping retail managers forecast product demand.
Here is historical data for Product ID: {product_id}:

{data.head(20).to_markdown(index=False)}

Based on the above, predict demand for the next 3 weeks. Also mention key influencing factors in bullet points or short paragraphs. Be clear and concise.
"""

        response = ollama.chat(
            model='gemma:2b',
            messages=[{"role": "user", "content": prompt}]
        )

        forecast_text = response['message']['content'].strip()

        # Split lines and structure output if possible
        lines = [line.strip() for line in forecast_text.split('\n') if line.strip()]
        forecast = []

        for i, line in enumerate(lines, start=1):
            forecast.append({
                "week": f"Week {i}",
                "description": line
            })

        return forecast
