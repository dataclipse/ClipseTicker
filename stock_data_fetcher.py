import requests
import db_manager as db
from datetime import datetime

class PolygonStockFetcher:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
    
    def get_stock_price(self, date):
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

if __name__ == "__main__":
    api_key = 'PExIEzmSroZNIvEejszRnb2_ygmps_Mb'
    stock_fetcher = PolygonStockFetcher(api_key)
    date = '2024-10-18'
    data = stock_fetcher.get_stock_price(date)
    data_insert = db.DBManager()
    if data:
        for stock in data:
           timestamp = datetime.now()
           data_insert.insert_stock(stock['T'], stock['c'], stock['h'], stock['l'], stock['o'], stock['t'], timestamp)
           