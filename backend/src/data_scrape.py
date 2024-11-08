import requests
from .db_manager import DBManager
import time
import random
from datetime import datetime

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
        while True:
            try:
                # Fetch data from API
                response = requests.get(API_URL)
                response.raise_for_status()
                
                data = response.json()
                stock_list = data.get('data', {}).get('data',[])
                
                if not isinstance(stock_list, list):
                    print("Unexpected format: stock_list is not a list.")
                    return
                
                stock_data_list = []
                # Iterate through each stock and store it
                for stock in stock_list:
                    # Build dictionary for each stock entry
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
                    # Store using ScrapeManager
                
                db_manager.scrape_manager.create_scrape_batch(stock_data_list)
                print("Stock data stored successfully. Sleeping for ~1 minute")
                
                # Reset delay after successful request
                delay = 60 + random.uniform(-10, 10)  # Add randomness to delay
            except requests.exceptions.HTTPError as http_err:
                if response.status_code == 429:  # Too Many Requests
                    print("Rate limit hit; backing off.")
                    delay = min(delay * 2, 600)  # Exponential backoff, max 10 minutes
                else:
                    print(f"HTTP error occurred: {http_err}")
            except requests.exceptions.RequestException as req_err:
                print(f"Request error occurred: {req_err}")
                delay = min(delay * 2, 600)  # Exponential backoff, max 10 minutes
                
            time.sleep(delay)
    except KeyboardInterrupt:
        print("Execution interrupted by the user.")
    
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")

# Main function to coordinate the scraping process
def main():
    fetch_and_store_stock_data()

if __name__ == '__main__':
    main()
