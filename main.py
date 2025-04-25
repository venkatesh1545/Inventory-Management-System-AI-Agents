# test_inventory_check.py

from agents.inventory_agent import InventoryAgent

# Initialize the agent with the path to your SQLite database
inventory_agent = InventoryAgent(db_path='database/inventory.db')

# Provide the product ID you want to test
product_id = '9610'

# Call the method that retrieves stock alerts
inventory = inventory_agent.check_stock_alerts(product_id=product_id)

# Debug print the results
print("🔍 Inventory Check Output:")
print(inventory)

# Optionally print specific parts
if inventory and 'stock_levels' in inventory:
    print("\n📦 Stock Levels:")
    for item in inventory['stock_levels']:
        print(item)

    if not inventory['stock_levels']:
        print("⚠️ No stock levels found for this product.")
else:
    print("❌ No 'stock_levels' key found in the result.")
