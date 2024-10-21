import requests
import db_manager as db
from datetime import datetime

class PolygonStockFetcher:
    def __init__(self, api_key):
        self.database_connect = db.DBManager()
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
    
    def get_stock_data(self, date):
        # Define the parameters for the API request
        endpoint = f"/v2/aggs/grouped/locale/us/market/stocks/{date}"
        url = self.base_url + endpoint
        params = {
            'adjusted': 'true',
            'apikey': self.api_key
        }

        # Make the API request
        response = requests.get(url, params=params)
        data = response.json()

        # Handle response
        if response.status_code == 200:
            if 'results' in data:
                return data['results']
            else:
                print(f"No data found. Response: {data}")
                return None
        else:
            print(f"Error fetching data: {response.status_code} - {response.text}")
            return None
        
    def load_stock_data(self, stock_data):
        if stock_data:
            for stock in stock_data:
                timestamp = datetime.now()
                self.database_connect.insert_stock(stock['T'], stock['c'], stock['h'], stock['l'], stock['o'], stock['t'], timestamp)
           