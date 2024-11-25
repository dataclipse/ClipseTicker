# stock_analysis_fetcher.py
import requests
from ..db_manager import DBManager
import time
import random
from datetime import datetime, timezone
import logging 
import csv
import os
import json
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
        try:
            # Fetch stock data from the API
            response = requests.get(self.API_URL, headers=self.HEADERS)
            
            # Raise an exception for HTTP errors
            response.raise_for_status() 
            
            # Parse the JSON response
            data = response.json() 
            stock_list = data.get('data', {}).get('data',[])
            
            # Check if stock_list is a list, otherwise logger.debug an error and exit
            if not isinstance(stock_list, list):
                logger.info("Unexpected format: stock_list is not a list.")
                return
            
            # List to hold stock data dictionaries
            stock_data_list = [] 
            
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
                    "timestamp": datetime.now(timezone.utc)
                }
                stock_data_list.append(stock_data)
                
            logger.info(f'Fetching data from Stock Analysis {datetime.now()}')
            return stock_data_list
        
        except requests.exceptions.HTTPError as http_err:
            # Handle HTTP errors, particularly rate limiting (status 429)
            if response.status_code == 429:  # Too Many Requests
                logger.error("Rate limit hit; backing off.") 
                # Exponential backoff, max 10 minutes
                delay = min(delay * 2, 600)  
            else:
                logger.error(f"HTTP error occurred: {http_err}")
        
        # Handle other request errors (e.g., network issues)
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Request error occurred: {req_err}")
            # Exponential backoff, max 10 minutes
            delay = min(delay * 2, 600)  

    def store_stock_data(self, stock_data_list):
        # Store a batch of stock data in the database
        self.db_manager.scrape_manager.create_scrape_batch(stock_data_list)
        logger.info(f"Stock data of {len(stock_data_list)} rows stored successfully.")

    def fetch_and_store_stock_data(self):
        # Initial delay set to 0 seconds
        delay = 0
        
        # Generate a random delay between 0 and 5 seconds
        delay = random.uniform(0, 5)
        time.sleep(delay)
        
        # Fetch stock data from the source
        result = self.fetch_stock_data()
        
        # If data was fetched successfully
        if result is not None: 
            # Store the fetched data
            self.store_stock_data(result) 

    def fetch_ticker_data(self):
        # Build the uri list
        csv_file_path = os.path.join(os.path.dirname(__file__), 'column_data', 'stock_scrape_columns.csv')
        
        urls=[]
        identifiers=[]
        
        try:
            with open(csv_file_path, 'r', newline='') as csvfile:
                csv_reader = csv.reader(csvfile, delimiter=';')
                next(csv_reader)
                for row in csv_reader:
                    url = f"https://stockanalysis.com/api/screener/s/d/{row[1]}"
                    urls.append(url)
                    identifiers.append(row[0])
                
                ticker_data = {identifier: url for identifier, url in zip(identifiers, urls)}
                
                for identifier, url in ticker_data.items():
                    logger.info(f"Identifier: {identifier}, URL: {url}")
                    response = requests.get(url.strip(), headers=self.HEADERS)
                    
                    response.raise_for_status() 
                    
                    data = response.json() 
                    
                    stock_list = []
                    
                    stock_list = data.get('data', {}).get('data',[])
                    
                    # Check if stock_list is a list
                    if not isinstance(stock_list, list):
                        logger.info("Unexpected format: stock_list is not a list.")
                        return
                    
                    stock_data_list = [] 
                    
                    for stock in stock_list:
                        # Check for the specific condition to skip
                        if identifier == 'return_from_ipo_price':
                            # Check if the value is not a float
                            if not isinstance(stock[1], float):
                                continue  # Skip to the next iteration
                        stock_data = {
                            "ticker_symbol": stock[0],
                            # Check if identifier is 'in_index' and deserialize if true
                            identifier: stock[1] if identifier != 'in_index' else json.dumps(stock[1])  # Deserialize for 'in_index'
                        }
                        stock_data_list.append(stock_data)
                    self.db_manager.scrape_manager.batch_create_or_update_scrapes(stock_data_list)
                    logger.info(f"Stock data of {len(stock_data_list)} rows stored successfully for {identifier}.")
                    
                    time.sleep(30)
                
        except FileNotFoundError:
            logger.error(f"File not found: {csv_file_path}")
        except Exception as e:
            logger.error(f"An error occurred while reading the CSV file: {e}")
