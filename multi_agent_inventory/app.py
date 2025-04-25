import pprint
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
import pandas as pd

from agents.forecasting_agent import ForecastingAgent
from agents.inventory_agent import InventoryAgent
from agents.supplier_agent import SupplierAgent
from agents.pricing_agent import PricingAgent
from agents.customer_agent import CustomerAgent
from agents.store_agent import StoreAgent

app = Flask(__name__)
CORS(app)

DB_PATH = 'database/inventory.db'
os.makedirs('database', exist_ok=True)

def get_db_connection():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

# Initialize agents
forecasting_agent = ForecastingAgent(DB_PATH)
inventory_agent = InventoryAgent(DB_PATH)
supplier_agent = SupplierAgent(DB_PATH)
pricing_agent = PricingAgent(DB_PATH)
customer_agent = CustomerAgent(DB_PATH)
store_agent = StoreAgent(DB_PATH)

def initialize_database():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS demand_forecasting (
            [Product ID] TEXT, [Date] TEXT, [Store ID] TEXT,
            [Sales Quantity] INTEGER, [Price] REAL, [Promotions] TEXT CHECK ([Promotions] IN ('YES', 'NO')),
            [Seasonality Factors] TEXT, [External Factors] TEXT,
            [Demand Trend] TEXT, [Customer Segments] TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory_monitoring (
            [Store ID] TEXT, [Product ID] TEXT, [Stock Levels] INTEGER,
            [Reorder Point] INTEGER, [Supplier Lead Time (days)] INTEGER,
            [Expiry Date] TEXT, [Warehouse Capacity] INTEGER,
            [Order Fulfillment Time (days)] INTEGER
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pricing_optimization (
            [Product ID] TEXT, [Price] REAL, [Competitor Prices] REAL,
            [Discounts] REAL, [Sales Volume] INTEGER,
            [Return Rate (%)] REAL, [Elasticity Index] REAL, [Storage Cost] REAL
        )
    ''')

    conn.commit()
    conn.close()

@app.route('/api/upload_csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    table_name = request.form.get('table_name', '')

    if file.filename == '' or not file.filename.endswith('.csv'):
        return jsonify({"error": "Invalid or no file selected"}), 400

    try:
        df = pd.read_csv(file)
        column_mapping = {
            'Product_ID': 'Product ID', 'Store_ID': 'Store ID', 'Sales_Quantity': 'Sales Quantity',
            'Seasonality_Factors': 'Seasonality Factors', 'External_Factors': 'External Factors',
            'Demand_Trend': 'Demand Trend', 'Customer_Segments': 'Customer Segments',
            'Stock_Levels': 'Stock Levels', 'Reorder_Point': 'Reorder Point',
            'Supplier_Lead_Time (days)': 'Supplier Lead Time (days)',
            'Expiry_Date': 'Expiry Date', 'Warehouse_Capacity': 'Warehouse Capacity',
            'Order_Fulfillment_Time (days)': 'Order Fulfillment Time (days)',
            'Competitor_Prices': 'Competitor Prices', 'Sales_Volume': 'Sales Volume',
            'Return_Rate (%)': 'Return Rate (%)', 'Elasticity_Index': 'Elasticity Index',
            'Storage_Cost': 'Storage Cost'
        }

        df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns}, inplace=True)
        if table_name not in ['demand_forecasting', 'inventory_monitoring', 'pricing_optimization']:
            return jsonify({"error": "Invalid table name"}), 400

        with get_db_connection() as conn:
            df.to_sql(table_name, conn, if_exists='append', index=False)

        return jsonify({"success": True, "message": f"Data imported to {table_name}", "rowCount": len(df)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/forecast', methods=['POST'])
def generate_forecast():
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400

    try:
        forecast = forecasting_agent.generate_forecast(product_id)
        return jsonify({"forecast": forecast if forecast else []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/inventory', methods=['POST'])
def inventory_check():
    try:
        data = request.json
        product_id = data.get('product_id')

        print(f"[DEBUG] Received product_id: {product_id}")

        if not product_id:
            return jsonify({"error": "Product ID is required"}), 400

        result = inventory_agent.check_stock_alerts(product_id)

        if not result or not result.get('stock_levels'):
            print(f"[DEBUG] No inventory found for product_id: {product_id}")
            return jsonify({
                "stock_levels": [],
                "message": "No inventory data available for this product."
            }), 200

        # 🔁 Deduplicate stock_levels based on (Product ID, Store ID)
        unique_stock = []
        seen = set()
        for item in result['stock_levels']:
            key = (item.get('Product ID'), item.get('Store ID'))
            if key not in seen:
                seen.add(key)
                unique_stock.append(item)

        result['stock_levels'] = unique_stock

        print(f"[DEBUG] Returning {len(unique_stock)} unique inventory records for product_id: {product_id}")
        pprint.pprint(result)

        return jsonify(result)

    except Exception as e:
        print(f"[ERROR] inventory_check: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/supply_needs', methods=['GET'])
def get_supply_needs():
    try:
        supply_needs = supplier_agent.get_supply_needs()
        return jsonify({"supply_needs": supply_needs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/optimize_prices', methods=['POST'])
def optimize_prices():
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400
    try:
        price_optimization = pricing_agent.optimize_prices(product_id)
        return jsonify({"price_optimization": price_optimization})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/customer_behavior', methods=['POST'])
def simulate_customer_behavior():
    data = request.json
    segment = data.get('segment')
    try:
        behavior = customer_agent.simulate_behavior(segment)
        return jsonify({"customer_behavior": behavior})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/store_status', methods=['POST'])
def get_store_status():
    data = request.json
    store_id = data.get('store_id')
    if not store_id:
        return jsonify({"error": "Store ID is required"}), 400
    try:
        store_status = store_agent.get_store_status(store_id)
        return jsonify({"store_status": store_status})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/add_data', methods=['POST'])
def add_manual_data():
    data = request.json
    table = data.get('table_name')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if table == 'demand_forecasting':
            cursor.execute('''INSERT INTO demand_forecasting
                ([Product ID], [Date], [Sales Quantity], [Price], [Promotions],
                 [Seasonality Factors], [External Factors])
                VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (data['product_id'], data['date'], data['sales_quantity'],
                 data['price'], data.get('promotions', 'NO'),
                 data.get('seasonality_factors', ''), data.get('external_factors', ''))
            )

        elif table == 'inventory_monitoring':
            cursor.execute('''INSERT INTO inventory_monitoring
                ([Store ID], [Product ID], [Stock Levels], [Reorder Point],
                 [Supplier Lead Time (days)], [Expiry Date], [Warehouse Capacity],
                 [Order Fulfillment Time (days)])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (data['store_id'], data['product_id'], data['stock_levels'],
                 data['reorder_point'], data['supplier_lead_time'],
                 data['expiry_date'], data['warehouse_capacity'],
                 data['order_fulfillment_time'])
            )

        elif table == 'pricing_optimization':
            cursor.execute('''INSERT INTO pricing_optimization
                ([Product ID], [Price], [Competitor Prices], [Discounts],
                 [Sales Volume], [Return Rate (%)], [Elasticity Index], [Storage Cost])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (data['product_id'], data['price'], data['competitor_prices'],
                 data['discounts'], data['sales_volume'], data['return_rate'],
                 data['elasticity_index'], data['storage_cost'])
            )

        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": f"Data added to {table}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        products = set()
        for table in ['demand_forecasting', 'inventory_monitoring', 'pricing_optimization']:
            cursor.execute(f'SELECT DISTINCT "Product ID" FROM {table}')
            products.update(row[0] for row in cursor.fetchall())
        conn.close()
        return jsonify({"products": list(products)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stores', methods=['GET'])
def get_stores():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT [Store ID] FROM inventory_monitoring")
        stores = [row[0] for row in cursor.fetchall()]
        conn.close()
        return jsonify({"stores": stores})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    initialize_database()
    app.run(debug=True)
