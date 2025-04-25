import sqlite3
import pandas as pd
import ollama

class InventoryAgent:
    def __init__(self, db_path):
        self.db_path = db_path

    def fetch_inventory_status(self, product_id):
        print(f"Fetching inventory for Product ID: {product_id}")
        query = """
        SELECT * FROM inventory_monitoring
        WHERE "Product ID" = ?
        """
        try:
            with sqlite3.connect(self.db_path, check_same_thread=False) as conn:
                df = pd.read_sql_query(query, conn, params=(str(product_id),))
                print("Fetched rows:\n", df)
                return df
        except Exception as e:
            print("Error fetching data from database:", e)
            return pd.DataFrame()

    def check_stock_alerts(self, product_id):
        data = self.fetch_inventory_status(product_id)
        if data.empty:
            return {"stock_levels": []}  # Important to return empty list, not just message

        prompt = f"""You're an AI inventory manager. Here is inventory data for Product ID {product_id}:

    {data.to_markdown(index=False)}

    Analyze the data and:
    - Determine if stock is low
    - Check for nearing expiry items
    - Recommend reorder if needed
    - Simulate a reorder action
    - Notify warehouse if restocking is necessary
    """

        try:
            response = ollama.chat(
                model='gemma:2b',
                messages=[{"role": "user", "content": prompt}]
            )
            message = response['message']['content']
            print("AI Response:", message)

            # Return actual data + alert message
            return {
                "stock_levels": data.fillna("").to_dict(orient="records"),
                "alert": message
            }

        except Exception as e:
            return {
                "stock_levels": data.fillna("").to_dict(orient="records"),
                "alert": f"Failed to get response from Ollama: {str(e)}"
            }
