document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initNavigation();
    initDataTabs();
    initForms();
    loadProductAndStoreData();
    initCharts();
});

// Navigation between main views
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active navigation item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update active view
            const target = this.getAttribute('data-target');
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById(`${target}-view`).classList.add('active');
        });
    });
}

// Data entry tab switching
function initDataTabs() {
    const dataTabs = document.querySelectorAll('.data-tab');
    
    dataTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            dataTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            const target = this.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${target}-form-tab`).classList.remove('hidden');
        });
    });
}

// Form initialization and event handlers
function initForms() {
    // Forecast form
    const forecastForm = document.getElementById('forecast-form');
    if (forecastForm) {
        forecastForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productId = document.getElementById('forecast-product-id').value;
            if (!productId) {
                alert('Please select a Product ID');
                return;
            }
            generateForecast(productId);
        });
    }
    
    // Inventory form
    const inventoryForm = document.getElementById('inventory-form');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productId = document.getElementById('inventory-product-id').value;
            if (!productId) {
                alert('Please select a Product ID');
                return;
            }
            checkStockLevels(productId);
        });
    }
    
    // Pricing form
    const pricingForm = document.getElementById('pricing-form');
    if (pricingForm) {
        pricingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productId = document.getElementById('pricing-product-id').value;
            if (!productId) {
                alert('Please select a Product ID');
                return;
            }
            optimizePrices(productId);
        });
    }
    
    // Customer simulation form
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const segment = document.getElementById('customer-segment').value;
            simulateCustomerBehavior(segment);
        });
    }
    
    // Store status form
    const storeForm = document.getElementById('store-form');
    if (storeForm) {
        storeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const storeId = document.getElementById('store-id').value;
            if (!storeId) {
                alert('Please select a Store ID');
                return;
            }
            getStoreStatus(storeId);
        });
    }
    
    // Supply needs button
    const checkSupplyBtn = document.getElementById('check-supply-needs');
    if (checkSupplyBtn) {
        checkSupplyBtn.addEventListener('click', function() {
            getSupplyNeeds();
        });
    }
    
    // CSV upload form
    const csvUploadForm = document.getElementById('csv-upload-form');
    if (csvUploadForm) {
        csvUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(csvUploadForm);
            
            // Show loading status
            const statusDiv = document.getElementById('upload-status');
            statusDiv.className = 'status loading mt-4';
            statusDiv.textContent = 'Uploading...';
            statusDiv.classList.remove('hidden');
            
            fetch('http://localhost:5000/api/upload_csv', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Show success status with row count
                statusDiv.className = 'status success mt-4';
                statusDiv.textContent = `${data.message} (${data.rowCount || 0} rows)`;
                
                // Refresh product and store dropdowns
                loadProductAndStoreData();
                
                // Reset form
                csvUploadForm.reset();
                
                // Auto-trigger relevant data load based on table name
                const tableName = formData.get('table_name');
                if (tableName === 'demand_forecasting') {
                    // Get the first product ID and load forecast data
                    fetch('http://localhost:5000/api/products')
                        .then(response => response.json())
                        .then(productData => {
                            if (productData.products && productData.products.length > 0) {
                                const firstProductId = productData.products[0];
                                document.getElementById('forecast-product-id').value = firstProductId;
                                generateForecast(firstProductId);
                            }
                        })
                        .catch(err => console.error('Error fetching products after upload:', err));
                } else if (tableName === 'inventory_monitoring') {
                    // Get the first product ID and load inventory data
                    fetch('http://localhost:5000/api/products')
                        .then(response => response.json())
                        .then(productData => {
                            if (productData.products && productData.products.length > 0) {
                                const firstProductId = productData.products[0];
                                document.getElementById('inventory-product-id').value = firstProductId;
                                checkStockLevels(firstProductId);
                            }
                        })
                        .catch(err => console.error('Error fetching products after upload:', err));
                } else if (tableName === 'pricing_optimization') {
                    // Get the first product ID and load pricing data
                    fetch('http://localhost:5000/api/products')
                        .then(response => response.json())
                        .then(productData => {
                            if (productData.products && productData.products.length > 0) {
                                const firstProductId = productData.products[0];
                                document.getElementById('pricing-product-id').value = firstProductId;
                                optimizePrices(firstProductId);
                            }
                        })
                        .catch(err => console.error('Error fetching products after upload:', err));
                }
            })
            .catch(error => {
                console.error('Error uploading CSV:', error);
                
                // Show error status
                statusDiv.className = 'status error mt-4';
                statusDiv.textContent = `Error: ${error.message}`;
            });
        });
    }
    
    // Manual data entry forms
    const dataForms = [
        document.getElementById('demand-data-form'),
        document.getElementById('inventory-data-form'),
        document.getElementById('pricing-data-form')
    ];
    
    dataForms.forEach(form => {
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                saveManualData(form);
            });
        }
    });
}

// API Calls to Backend

// Load products and stores for dropdowns
function loadProductAndStoreData() {
    // Load product IDs
    fetch('http://localhost:5000/api/products')
        .then(response => response.json())
        .then(data => {
            const productSelects = [
                document.getElementById('forecast-product-id'),
                document.getElementById('inventory-product-id'),
                document.getElementById('pricing-product-id')
            ];

            if (Array.isArray(data.products) && data.products.length > 0) {
                const options = data.products.map(id => `<option value="${id}">${id}</option>`).join('');
                productSelects.forEach(select => {
                    if (select) {
                        select.innerHTML = `<option value="">Select Product ID...</option>${options}`;
                    }
                });
            } else {
                productSelects.forEach(select => {
                    if (select) {
                        select.innerHTML = `<option value="">No products found</option>`;
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
        });

    // Load store IDs
    fetch('http://localhost:5000/api/stores')
        .then(response => response.json())
        .then(data => {
            const storeSelect = document.getElementById('store-id');
            if (storeSelect) {
                if (Array.isArray(data.stores) && data.stores.length > 0) {
                    const options = data.stores.map(id => `<option value="${id}">${id}</option>`).join('');
                    storeSelect.innerHTML = `<option value="">Select Store ID...</option>${options}`;
                } else {
                    storeSelect.innerHTML = `<option value="">No stores found</option>`;
                }
            }
        })
        .catch(error => {
            console.error('Error loading stores:', error);
        });
}


// Generate forecast based on product ID
function generateForecast(productId) {
    const resultsDiv = document.getElementById('forecast-results');

    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span class="ml-2 text-blue-700">Loading forecast...</span>
            </div>
        `;
    }

    fetch('http://localhost:5000/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        if (!Array.isArray(data.forecast) || data.forecast.length === 0) {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    No forecast data available for this product.
                </div>
            `;
            return;
        }

        console.log("Received forecast:", data.forecast);

        // Create forecast table
        const table = document.createElement('table');
        table.className = 'min-w-full bg-white';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Week', 'Description'].forEach(header => {
            const th = document.createElement('th');
            th.className = 'py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forecast.forEach(entry => {
            const tr = document.createElement('tr');
            ['week', 'description'].forEach(key => {
                const td = document.createElement('td');
                td.className = 'py-2 px-4 border-b border-gray-200 text-sm';
                td.textContent = entry[key];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(table);

        // Optional: update chart if needed
        if (typeof updateForecastChart === 'function') {
            updateForecastChart(data.forecast);
        }

    })
    .catch(error => {
        console.error('Error generating forecast:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-red-500">
                    <span>Error: ${error.message}</span>
                </div>
            `;
        }
    });
}


// Check inventory stock levels
function checkStockLevels(productId) {
    const resultsDiv = document.getElementById('inventory-results');

    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span class="ml-2 text-blue-700">Loading inventory data...</span>
            </div>
        `;
    }

    fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }

        if (resultsDiv) {
            if (data.stock_levels && data.stock_levels.length > 0) {
                const table = document.createElement('table');
                table.className = 'min-w-full bg-white';

                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                const keys = Object.keys(data.stock_levels[0]);

                keys.forEach(key => {
                    const th = document.createElement('th');
                    th.className = 'py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
                    th.textContent = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
                    headerRow.appendChild(th);
                });

                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                data.stock_levels.forEach(row => {
                    const tr = document.createElement('tr');
                    keys.forEach(key => {
                        const td = document.createElement('td');
                        td.className = 'py-2 px-4 border-b border-gray-200 text-sm';

                        const value = row[key];
                        if (key.toLowerCase() === 'reorder alert' && value.toString().trim().toUpperCase() === 'YES') {
                            td.className += ' font-medium text-red-600';
                        } else if (key.toLowerCase() === 'expiry warning' && value.toString().trim().toUpperCase() === 'EXPIRED') {
                            td.className += ' font-medium text-red-600';
                        }

                        td.textContent = value;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);
                resultsDiv.innerHTML = '';
                resultsDiv.appendChild(table);

                updateInventoryChart(data.stock_levels);

                // ✅ Updated alert section
                const alertsDiv = document.getElementById('inventory-alerts');
                if (alertsDiv) {
                    alertsDiv.innerHTML = '';
                    let hasAlert = false;

                    data.stock_levels.forEach(item => {
                        const productId = item['Product ID'] || item['product_id'] || 'N/A';
                        const storeId = item['Store ID'] || item['store_id'] || 'N/A';

                        const reorder = (item['reorder_alert'] || item['Reorder Alert'] || item['reorder'] || '').toString().trim().toUpperCase();
                        const expiry = (item['expiry_warning'] || item['Expiry Warning'] || item['expiry'] || '').toString().trim().toUpperCase();


                        if (reorder === 'YES') {
                            hasAlert = true;
                            alertsDiv.innerHTML += `
                                <div class="flex justify-between items-center bg-red-50 border-l-4 border-red-500 p-4 mb-2">
                                    <div>
                                        <div class="font-medium text-red-800">Low Stock Alert</div>
                                        <div class="text-sm text-red-700">Product ID: ${productId} in Store ID: ${storeId}</div>
                                    </div>
                                    <button class="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200">Restock</button>
                                </div>
                            `;
                        }

                        if (expiry === 'EXPIRED') {
                            hasAlert = true;
                            alertsDiv.innerHTML += `
                                <div class="flex justify-between items-center bg-amber-50 border-l-4 border-amber-500 p-4 mb-2">
                                    <div>
                                        <div class="font-medium text-amber-800">Expiry Alert</div>
                                        <div class="text-sm text-amber-700">Product ID: ${productId} in Store ID: ${storeId}</div>
                                    </div>
                                    <button class="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded hover:bg-amber-200">Review</button>
                                </div>
                            `;
                        }
                    });

                    if (data.alert) {
                        alertsDiv.innerHTML += `
                            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-2 rounded">
                                <div class="font-medium text-blue-800 mb-1">AI Inventory Insights</div>
                                <div class="text-sm text-blue-700 prose prose-sm max-w-none">${marked.parse(data.alert)}</div>
                            </div>
                        `;
                    }
                    
                    
                    // Render "No alerts" message only if there are no stock/expiry alerts
                    if (!hasAlert && !data.alert) {
                        alertsDiv.innerHTML += `
                            <div class="text-gray-500 text-sm text-center">
                                No alerts for the selected product.
                            </div>
                        `;
                    }
                    
                }

            } else {
                resultsDiv.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        No inventory data available for this product.
                    </div>
                `;

                const alertsDiv = document.getElementById('inventory-alerts');
                if (alertsDiv) {
                    alertsDiv.innerHTML = `
                        <div class="text-gray-500 text-sm text-center">
                            No alerts for the selected product.
                        </div>
                    `;
                }
            }
        }
    })
    .catch(error => {
        console.error('Error checking stock levels:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-red-500">
                    <span>Error: ${error.message}</span>
                </div>
            `;
        }
    });
}


// Optimize prices
function optimizePrices(productId) {
    const resultsDiv = document.getElementById('pricing-results');
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span class="ml-2 text-blue-700">Optimizing pricing...</span>
            </div>
        `;
    }
    
    fetch('http://localhost:5000/api/optimize_prices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (resultsDiv) {
            if (data.price_optimization && data.price_optimization.length > 0) {
                // Create a table to display pricing results
                let html = `
                    <table class="min-w-full bg-white">
                        <thead>
                            <tr>
                `;
                
                // Headers
                const keys = Object.keys(data.price_optimization[0]);
                keys.forEach(key => {
                    html += `<th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</th>`;
                });
                
                html += `
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                // Data rows
                data.price_optimization.forEach(row => {
                    html += `<tr>`;
                    keys.forEach(key => {
                        if (key === 'Price Adjustment') {
                            const oldPrice = row['Price'];
                            const newPrice = row[key];
                            const textClass = newPrice < oldPrice ? 'text-red-600' : (newPrice > oldPrice ? 'text-green-600' : 'text-gray-600');
                            const diffDisplay = newPrice < oldPrice ? `↓ $${(oldPrice - newPrice).toFixed(2)}` : (newPrice > oldPrice ? `↑ $${(newPrice - oldPrice).toFixed(2)}` : '—');
                            
                            html += `<td class="py-2 px-4 border-b border-gray-200 text-sm font-medium ${textClass}">$${newPrice.toFixed(2)} <span class="text-xs ml-1">(${diffDisplay})</span></td>`;
                        } else if (key === 'Price' || key === 'Competitor Prices' || key === 'Discounts' || key === 'Storage Cost') {
                            html += `<td class="py-2 px-4 border-b border-gray-200 text-sm">$${row[key].toFixed(2)}</td>`;
                        } else {
                            html += `<td class="py-2 px-4 border-b border-gray-200 text-sm">${row[key]}</td>`;
                        }
                    });
                    html += `</tr>`;
                });
                
                html += `
                        </tbody>
                    </table>
                `;
                
                resultsDiv.innerHTML = html;
                
                // Update pricing chart if data available
                if (data.price_optimization.length > 0) {
                    updatePricingChart(data.price_optimization[0]);
                }
            } else {
                resultsDiv.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        No pricing data available for this product.
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Error optimizing prices:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-red-500">
                    <span>Error: ${error.message}</span>
                </div>
            `;
        }
    });
}

// Simulate customer behavior
function simulateCustomerBehavior(segment) {
    const resultsDiv = document.getElementById('customer-results');
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span class="ml-2 text-blue-700">Simulating customer behavior...</span>
            </div>
        `;
    }
    
    fetch('http://localhost:5000/api/customer_behavior', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segment: segment })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (resultsDiv && data.customer_behavior) {
            resultsDiv.innerHTML = `
                <div class="space-y-6">
                    <div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div class="text-lg font-medium mb-1">Customer Segment: ${data.customer_behavior.Segment}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <div class="text-gray-500 text-sm mb-1">Buy Probability</div>
                            <div class="text-2xl font-medium">${(data.customer_behavior['Buy Probability'] * 100).toFixed(0)}%</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <div class="text-gray-500 text-sm mb-1">Average Spend</div>
                            <div class="text-2xl font-medium">$${data.customer_behavior['Avg Spend'].toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="font-medium mb-2">Customer Insights:</div>
                        <div class="text-sm text-gray-600">
                            <p>Customers in the <strong>${data.customer_behavior.Segment}</strong> segment have a 
                            <strong>${(data.customer_behavior['Buy Probability'] * 100).toFixed(0)}%</strong> probability 
                            of making a purchase with an average spend of 
                            <strong>$${data.customer_behavior['Avg Spend'].toFixed(2)}</strong>.</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Update customer segment chart
            updateCustomerChart(data.customer_behavior);
        } else {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    No customer behavior data available.
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error simulating customer behavior:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-red-500">
                    <span>Error: ${error.message}</span>
                </div>
            `;
        }
    });
}

// Get store status
function getStoreStatus(storeId) {
    const resultsDiv = document.getElementById('store-results');
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span class="ml-2 text-blue-700">Loading store status...</span>
            </div>
        `;
    }
    
    fetch('http://localhost:5000/api/store_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ store_id: storeId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (resultsDiv) {
            if (data.store_status && data.store_status.length > 0) {
                // Create a table to display store results
                let html = `
                    <table class="min-w-full bg-white">
                        <thead>
                            <tr>
                `;
                
                // Headers
                const keys = Object.keys(data.store_status[0]);
                keys.forEach(key => {
                    html += `<th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</th>`;
                });
                
                html += `
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                // Data rows
                data.store_status.forEach(row => {
                    html += `<tr>`;
                    keys.forEach(key => {
                        if (key === 'Needs Restocking' && row[key] === 'YES') {
                            html += `<td class="py-2 px-4 border-b border-gray-200 text-sm font-medium text-red-600">${row[key]}</td>`;
                        } else {
                            html += `<td class="py-2 px-4 border-b border-gray-200 text-sm">${row[key]}</td>`;
                        }
                    });
                    html += `</tr>`;
                });
                
                html += `
                        </tbody>
                    </table>
                `;
                
                resultsDiv.innerHTML = html;
                
                // Update store chart
                updateStoreChart(data.store_status);
                
                // Update restock needs section
                updateRestockNeeds(data.store_status);
            } else {
                resultsDiv.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        No store data available.
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Error getting store status:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="flex items-center justify-center h-full text-red-500">
                    <span>Error: ${error.message}</span>
                </div>
            `;
        }
    });
}

// Get supply needs
function getSupplyNeeds() {
    const resultsDiv = document.getElementById('supply-results');
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span class="ml-2 text-blue-700">Checking supply needs...</span>
            </div>
        `;
    }
    
    fetch('http://localhost:5000/api/supply_needs')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (resultsDiv) {
                if (data.supply_needs && data.supply_needs.length > 0) {
                    // Create a table to display supply needs
                    let html = `
                        <table class="min-w-full bg-white">
                            <thead>
                                <tr>
                    `;
                    
                    // Headers
                    const keys = Object.keys(data.supply_needs[0]);
                    keys.forEach(key => {
                        html += `<th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</th>`;
                    });
                    
                    html += `
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    // Data rows
                    data.supply_needs.forEach(row => {
                        html += `<tr>`;
                        keys.forEach(key => {
                            if (key === 'Supply Required' && row[key] === 'YES') {
                                html += `<td class="py-2 px-4 border-b border-gray-200 text-sm font-medium text-red-600">${row[key]}</td>`;
                            } else if (key === 'total_stock' || key === 'avg_reorder') {
                                html += `<td class="py-2 px-4 border-b border-gray-200 text-sm">${parseFloat(row[key]).toFixed(0)}</td>`;
                            } else {
                                html += `<td class="py-2 px-4 border-b border-gray-200 text-sm">${row[key]}</td>`;
                            }
                        });
                        html += `</tr>`;
                    });
                    
                    html += `
                            </tbody>
                        </table>
                    `;
                    
                    resultsDiv.innerHTML = html;
                } else {
                    resultsDiv.innerHTML = `
                        <div class="flex items-center justify-center h-full text-gray-500">
                            No supply needs data available. Try uploading inventory data first.
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error getting supply needs:', error);
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div class="flex items-center justify-center h-full text-red-500">
                        <span>Error: ${error.message}</span>
                    </div>
                `;
            }
        });
}

// Upload CSV file
function uploadCSV() {
    const form = document.getElementById('csv-upload-form');
    const statusDiv = document.getElementById('upload-status');
    
    if (!form || !statusDiv) return;
    
    const formData = new FormData(form);
    
    // Show loading status
    statusDiv.className = 'status loading mt-4';
    statusDiv.textContent = 'Uploading...';
    statusDiv.classList.remove('hidden');
    
    fetch('http://localhost:5000/api/upload_csv', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Show success status with row count
        statusDiv.className = 'status success mt-4';
        statusDiv.textContent = `${data.message} (${data.rowCount || 0} rows)`;
        
        // Refresh product and store dropdowns
        loadProductAndStoreData();
        
        // Reset form
        form.reset();
        
        // Auto-trigger relevant data load based on table name
        const tableName = formData.get('table_name');
        if (tableName === 'demand_forecasting') {
            // Get the first product ID and load forecast data
            fetch('http://localhost:5000/api/products')
                .then(response => response.json())
                .then(productData => {
                    if (productData.products && productData.products.length > 0) {
                        const firstProductId = productData.products[0];
                        document.getElementById('forecast-product-id').value = firstProductId;
                        generateForecast(firstProductId);
                    }
                })
                .catch(err => console.error('Error fetching products after upload:', err));
        } else if (tableName === 'inventory_monitoring') {
            // Get the first product ID and load inventory data
            fetch('http://localhost:5000/api/products')
                .then(response => response.json())
                .then(productData => {
                    if (productData.products && productData.products.length > 0) {
                        const firstProductId = productData.products[0];
                        document.getElementById('inventory-product-id').value = firstProductId;
                        checkStockLevels(firstProductId);
                    }
                })
                .catch(err => console.error('Error fetching products after upload:', err));
        } else if (tableName === 'pricing_optimization') {
            // Get the first product ID and load pricing data
            fetch('http://localhost:5000/api/products')
                .then(response => response.json())
                .then(productData => {
                    if (productData.products && productData.products.length > 0) {
                        const firstProductId = productData.products[0];
                        document.getElementById('pricing-product-id').value = firstProductId;
                        optimizePrices(firstProductId);
                    }
                })
                .catch(err => console.error('Error fetching products after upload:', err));
        }
    })
    .catch(error => {
        console.error('Error uploading CSV:', error);
        
        // Show error status
        statusDiv.className = 'status error mt-4';
        statusDiv.textContent = `Error: ${error.message}`;
    });
}

// Save manual data
function saveManualData(form) {
    const formId = form.id;
    let statusDiv;
    
    if (formId === 'demand-data-form') {
        statusDiv = document.getElementById('demand-status');
    } else if (formId === 'inventory-data-form') {
        statusDiv = document.getElementById('inventory-data-status');
    } else if (formId === 'pricing-data-form') {
        statusDiv = document.getElementById('pricing-data-status');
    }
    
    if (!statusDiv) return;
    
    // Prepare form data
    const formData = new FormData(form);
    const jsonData = {};
    
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });
    
    // Show loading status
    statusDiv.className = 'status loading mt-4';
    statusDiv.textContent = 'Saving data...';
    statusDiv.classList.remove('hidden');
    
    fetch('http://localhost:5000/api/add_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Show success status
        statusDiv.className = 'status success mt-4';
        statusDiv.textContent = data.message || 'Data saved successfully!';
        
        // Refresh product and store dropdowns
        loadProductAndStoreData();
        
        // Reset form
        form.reset();
    })
    .catch(error => {
        console.error('Error saving data:', error);
        
        // Show error status
        statusDiv.className = 'status error mt-4';
        statusDiv.textContent = `Error: ${error.message}`;
    });
}

// Charts initialization and updates
let forecastChart, inventoryChart, pricingChart, customerChart, storeChart;

function initCharts() {
    // Initialize forecast chart
    const forecastCtx = document.getElementById('forecasting-chart');
    if (forecastCtx) {
        forecastChart = new Chart(forecastCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Actual Sales',
                        data: [],
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Forecast',
                        data: [],
                        borderColor: '#F59E0B',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sales Forecast'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Week'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Sales Quantity'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Initialize inventory chart
    const inventoryCtx = document.getElementById('inventory-chart');
    if (inventoryCtx) {
        inventoryChart = new Chart(inventoryCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Stock Level',
                        data: [],
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 1
                    },
                    {
                        label: 'Reorder Point',
                        data: [],
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: '#EF4444',
                        borderWidth: 1,
                        type: 'line'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Stock Levels & Reorder Points'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity'
                        }
                    }
                }
            }
        });
    }
    
    // Initialize pricing chart
    const pricingCtx = document.getElementById('pricing-chart');
    if (pricingCtx) {
        pricingChart = new Chart(pricingCtx, {
            type: 'bar',
            data: {
                labels: ['Current Price', 'Competitor Price', 'Optimized Price'],
                datasets: [{
                    label: 'Price Comparison',
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#3B82F6',
                        '#9CA3AF',
                        '#10B981'
                    ],
                    borderColor: [
                        '#2563EB',
                        '#6B7280',
                        '#059669'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Price Comparison'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Price ($)'
                        }
                    }
                }
            }
        });
    }
    
    // Initialize customer chart
    const customerCtx = document.getElementById('customer-chart');
    if (customerCtx) {
        customerChart = new Chart(customerCtx, {
            type: 'radar',
            data: {
                labels: ['Buy Probability', 'Avg. Spend', 'Frequency', 'Loyalty'],
                datasets: [
                    {
                        label: 'Budget',
                        data: [60, 20, 50, 30],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3B82F6',
                        pointBackgroundColor: '#3B82F6'
                    },
                    {
                        label: 'Premium',
                        data: [90, 80, 40, 70],
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10B981',
                        pointBackgroundColor: '#10B981'
                    },
                    {
                        label: 'Impulse',
                        data: [70, 30, 20, 10],
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderColor: '#F59E0B',
                        pointBackgroundColor: '#F59E0B'
                    },
                    {
                        label: 'Loyal',
                        data: [95, 60, 90, 100],
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        borderColor: '#8B5CF6',
                        pointBackgroundColor: '#8B5CF6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Customer Segment Comparison'
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Initialize store chart
    const storeCtx = document.getElementById('store-chart');
    if (storeCtx) {
        storeChart = new Chart(storeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Adequate Stock', 'Low Stock', 'Out of Stock'],
                datasets: [{
                    data: [70, 25, 5],
                    backgroundColor: [
                        '#10B981',
                        '#F59E0B',
                        '#EF4444'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Stock Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Initialize static charts for the dashboard
    initDashboardCharts();
}

function initDashboardCharts() {
    // Forecast chart for dashboard
    const dashForecastCtx = document.getElementById('forecast-chart');
    if (dashForecastCtx) {
        new Chart(dashForecastCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Actual Sales',
                        data: [1200, 1350, 1100, 1500, 1300, 1450],
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Forecast',
                        data: [1200, 1350, 1100, 1500, 1400, 1600],
                        borderColor: '#F59E0B',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Stock chart for dashboard
    const dashStockCtx = document.getElementById('stock-chart');
    if (dashStockCtx) {
        new Chart(dashStockCtx, {
            type: 'bar',
            data: {
                labels: ['Electronics', 'Clothing', 'Food', 'Home', 'Beauty'],
                datasets: [
                    {
                        label: 'Current Stock',
                        data: [350, 275, 400, 325, 150],
                        backgroundColor: '#3B82F6'
                    },
                    {
                        label: 'Target Stock',
                        data: [300, 250, 350, 300, 200],
                        backgroundColor: '#10B981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}


function updateForecastChart(forecastData) {
    if (!forecastChart || !forecastData || forecastData.length === 0) return;

    const labels = forecastData.map(item => item.week || item.Date || ''); // support both keys
    const salesData = forecastData.map(item => {
        const match = item.description?.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    });

    // Filter out nulls
    const cleanSalesData = salesData.filter(x => x !== null);
    if (cleanSalesData.length === 0) {
        console.warn("No valid sales values to forecast.");
        return;
    }

    // Historical data
    forecastChart.data.labels = labels;
    forecastChart.data.datasets[0].data = salesData;

    const lastSales = cleanSalesData[cleanSalesData.length - 1];
    const forecastValues = [];

    for (let i = 1; i <= 3; i++) {
        forecastValues.push(Math.round(lastSales * (1 + (Math.random() * 0.2 - 0.1))));
    }

    // Future labels: Week 16, Week 17, etc.
    const lastWeek = labels[labels.length - 1];
    let lastWeekNum = parseInt(lastWeek?.match(/\d+/)?.[0] || "15"); // default if not found
    const futureLabels = [];

    for (let i = 1; i <= 3; i++) {
        futureLabels.push(`Week ${lastWeekNum + i}`);
    }

    forecastChart.data.labels = [...labels, ...futureLabels];

    const actualDataWithNull = [...salesData, null, null, null];
    forecastChart.data.datasets[0].data = actualDataWithNull;

    const forecastDataWithNull = Array(salesData.length).fill(null);
    forecastChart.data.datasets[1].data = [...forecastDataWithNull, ...forecastValues];

    forecastChart.update();
}

function updateInventoryChart(stockData) {
    if (!inventoryChart || !stockData || stockData.length === 0) return;
    
    const labels = stockData.map(item => item['Store ID']);
    const stockLevels = stockData.map(item => item['Stock Levels']);
    const reorderPoints = stockData.map(item => item['Reorder Point']);
    
    inventoryChart.data.labels = labels;
    inventoryChart.data.datasets[0].data = stockLevels;
    inventoryChart.data.datasets[1].data = reorderPoints;
    
    inventoryChart.update();
}

function updatePricingChart(pricingData) {
    if (!pricingChart || !pricingData) return;
    
    const currentPrice = pricingData.Price;
    const competitorPrice = pricingData['Competitor Prices'];
    const optimizedPrice = pricingData['Price Adjustment'];
    
    pricingChart.data.datasets[0].data = [currentPrice, competitorPrice, optimizedPrice];
    
    pricingChart.update();
}

function updateCustomerChart(customerData) {
    if (!customerChart || !customerData) return;
    
    const segment = customerData.Segment;
    const buyProbability = customerData['Buy Probability'] * 100;
    const avgSpend = customerData['Avg Spend'] / 10; // Scale down for chart
    
    // Highlight the selected segment
    customerChart.data.datasets.forEach(dataset => {
        if (dataset.label === segment) {
            dataset.borderWidth = 3;
            dataset.borderColor = '#3B82F6';
        } else {
            dataset.borderWidth = 1;
            dataset.borderColor = dataset.pointBackgroundColor;
        }
    });
    
    customerChart.update();
}

function updateStoreChart(storeData) {
    if (!storeChart || !storeData || storeData.length === 0) return;
    
    // Count items by stock status
    let adequateStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    
    storeData.forEach(item => {
        if (item['Stock Levels'] === 0) {
            outOfStock++;
        } else if (item['Needs Restocking'] === 'YES') {
            lowStock++;
        } else {
            adequateStock++;
        }
    });
    
    // Update chart data
    storeChart.data.datasets[0].data = [adequateStock, lowStock, outOfStock];
    
    storeChart.update();
}

function updateRestockNeeds(storeData) {
    if (!storeData || storeData.length === 0) return;
    
    const restockItems = document.getElementById('restock-items');
    if (!restockItems) return;
    
    // Filter items that need restocking
    const itemsNeedingRestock = storeData.filter(item => item['Needs Restocking'] === 'YES');
    
    if (itemsNeedingRestock.length === 0) {
        restockItems.innerHTML = `
            <div class="flex items-center justify-center h-32 text-gray-500">
                No items currently need restocking.
            </div>
        `;
        return;
    }
    
    // Build HTML for restock items
    let html = '';
    
    itemsNeedingRestock.forEach(item => {
        html += `
            <div class="p-4 border rounded flex items-center justify-between">
                <div>
                    <div class="font-medium">Product ID: ${item['Product ID']}</div>
                    <div class="text-sm text-gray-500">Current Stock: ${item['Stock Levels']}, Reorder Point: ${item['Reorder Point']}</div>
                </div>
                <button class="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200">Restock</button>
            </div>
        `;
    });
    
    restockItems.innerHTML = html;
}