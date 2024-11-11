# data_scrape.py
import requests
from .db_manager import DBManager
import time
import random
from datetime import datetime
import logging 
logger = logging.getLogger(__name__)

# Endpoint URL for fetching stock data
API_URL = "https://api.stockanalysis.com/api/screener/s/f?m=s&s=asc&c=s,revenue,marketCap,n,industry,price,change,volume,peRatio&cn=all&p=1&i=stocks&sc=s"

# Basic headers to make the request look more like a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "Accept": "application/json"
}

def fetch_and_store_stock_data():
    # Instantiate DBManager 
    db_manager = DBManager()
    delay = 60  # Initial delay set to 60 seconds

    try:
        while True: # Run indefinitely to continuously fetch and store stock data
            try:
                # Fetch data from the API
                response = requests.get(API_URL)
                response.raise_for_status() # Raise an exception for HTTP errors
                
                # Parse the JSON response
                data = response.json()
                stock_list = data.get('data', {}).get('data',[])
                
                # Check if stock_list is a list, otherwise logger.debug an error and exit
                if not isinstance(stock_list, list):
                    logger.debug("Unexpected format: stock_list is not a list.")
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
                
                # Insert all stock data into the database in a single batch
                db_manager.scrape_manager.create_scrape_batch(stock_data_list)
                logger.debug("Stock data stored successfully. Sleeping for ~1 minute")
                
                # Reset delay after a successful request and add a random variation to avoid exact intervals
                delay = 60 + random.uniform(-10, 10)
                
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
            
            # Wait for the defined delay before the next API call
            time.sleep(delay)
    except KeyboardInterrupt:
        # Handle manual interruption of the process
        logger.error("Execution interrupted by the user.")
    
    except requests.RequestException as e:
        # Log any other request-related exceptions that might not be caught in the loop
        logger.error(f"Error fetching data: {e}")

# Main function to coordinate the scraping process
def main():
    fetch_and_store_stock_data()

if __name__ == '__main__':
    main()
