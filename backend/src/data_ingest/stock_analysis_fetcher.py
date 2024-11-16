# stock_analysis_fetcher.py
import requests
from ..db_manager import DBManager
import time
import random
from datetime import datetime
import logging 
logger = logging.getLogger(__name__)


class StockAnalysisFetcher:
    
    def __init__(self):
        # Initialize the StockAnalysisFetcher
        self.db_manager = DBManager()
        
        # Endpoint URL for fetching stock data
        self.API_URL = "https://api.stockanalysis.com/api/screener/s/f?m=s&s=asc&c=s,revenue,marketCap,n,industry,price,change,volume,peRatio&cn=all&p=1&i=stocks&sc=s"
        
        # Basic headers to make the request look more like a browser
        self.HEADERS = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
            "Accept": "application/json"
        }

    def fetch_stock_data(self):
        # Fetch stock data from the API
        try:
            response = requests.get(self.API_URL, headers=self.HEADERS)
            response.raise_for_status() # Raise an exception for HTTP errors
            
            data = response.json() # Parse the JSON response
            stock_list = data.get('data', {}).get('data',[])
            
            
            # Check if stock_list is a list, otherwise logger.debug an error and exit
            if not isinstance(stock_list, list):
                logger.info("Unexpected format: stock_list is not a list.")
                return
            
            stock_data_list = [] # List to hold stock data dictionaries
            
            # Iterate through each stock entry and build a dictionary for each
            for stock in stock_list:
                stock_data = {
                    "ticker_symbol": stock.get("s", ""),
                    "company_name": stock.get("n", ""),
                    "price": stock.get("price", 0.0),
                    "change": stock.get("change", 0.0),
                    "industry": stock.get("industry", ""),
                    "volume": stock.get("volume",0.0),
                    "pe_ratio": stock.get("peRatio",0.0),
                    "timestamp": datetime.now()
                }
                stock_data_list.append(stock_data)
                
            logger.info(f'Fetching data from Stock Analysis {datetime.now()}')
            return stock_data_list
        except requests.exceptions.HTTPError as http_err:
            # Handle HTTP errors, particularly rate limiting (status 429)
            if response.status_code == 429:  # Too Many Requests
                logger.error("Rate limit hit; backing off.")
                delay = min(delay * 2, 600)  # Exponential backoff, max 10 minutes
            else:
                logger.error(f"HTTP error occurred: {http_err}")
        except requests.exceptions.RequestException as req_err:
            # Handle other request errors (e.g., network issues)
            logger.error(f"Request error occurred: {req_err}")
            delay = min(delay * 2, 600)  # Exponential backoff, max 10 minutes

    def store_stock_data(self, stock_data_list):
        self.db_manager.scrape_manager.create_scrape_batch(stock_data_list)
        logger.info("Stock data stored successfully.")

    def fetch_and_store_stock_data(self):
        delay = 0  # Initial delay set to 0 seconds
        delay = random.uniform(0, 5)
        time.sleep(delay)
        result = self.fetch_stock_data()
        
        if result is not None: # If data was fetched successfully
            self.store_stock_data(result) # Store the fetched data

if __name__ == '__main__':
    sa = StockAnalysisFetcher()
    sa.fetch_and_store_stock_data()
