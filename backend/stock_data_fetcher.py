import requests
import db_manager as db
from datetime import datetime, timedelta
import time

class PolygonStockFetcher:
    def __init__(self, api_key):
        self.database_connect = db.DBManager()
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.max_requests_per_minute = 5
        self.retry_limit = 3
    
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
            # Check if there are results in the response
            if data.get('resultsCount', 0) > 0:
                return data['results']
            else:
                # No stock data found, but the request was successful. Likely due to markets being closed for the day.
                print(f"No stock data found for {date}.")
                return []
        elif response.status_code == 429:
            # Handle rate limit error (429 Too Many Requests)
            print("Rate limit exceeded. Waiting for 60 seconds before retrying...")
            time.sleep(60) # Wait for 60 seconds before retrying
            return None
        else:
            # If the response status is not 200, raise an error
            print(f"Error fetching data: {response.status_code} - {response.text}")
            return None
        
    def load_stock_data(self, stock_data):
        if stock_data:
            for stock in stock_data:
                timestamp = datetime.now()
                self.database_connect.insert_stock(stock['T'], stock['c'], stock['h'], stock['l'], stock['o'], stock['t'], timestamp)

    def fetch_data_for_date_range(self, start_date, end_date):
        # Fetches stock data or a range of dates
        # Limits API requests to 5 per minute (free tier polygon.io api limit)
        # Retries on failure up to a limit o 3 retries
        
        current_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
        request_times = []

        while current_date <= end_date:
            formatted_date = current_date.strftime("%Y-%m-%d")
            success = False
            retries = 0

            # Check if the time since the first of the last 5 requests is within the rate limit
            if len(request_times) >= self.max_requests_per_minute:
                time_since_first_request = time.time() - request_times[0]
                if time_since_first_request < 60:
                    # If the time difference is less than 60 seconds, wait for the required time
                    wait_time = 60 - time_since_first_request
                    print(f"Reached request limit. Waiting for {wait_time:.2f} seconds before continuing...")
                    time.sleep(wait_time)

            while not success and retries < self.retry_limit:
                try:
                    print(f"Fetching data for {formatted_date}...")
                    stock_data = self.get_stock_data(formatted_date)
                    if stock_data is not None: # Handle valid responses, even if they are empty
                        self.load_stock_data(stock_data)
                        success = True
                        print(f"Data for {formatted_date} loaded successfully.")
                        request_times.append(time.time()) # Record the time of the successful request

                        # Keep only the last 'max_requests_per_minute' timestamps
                        if len(request_times) > self.max_requests_per_minute:
                            request_times.pop(0)
                    else:
                        raise Exception("Failed to fetch data from API.")
                except Exception as e:
                    retries += 1
                    print(f"Attempt {retries}/{self.retry_limit} failed for {formatted_date}. Error: {e}")
                    if retries < self.retry_limit:
                        print(f"Retrying {formatted_date}...")
                        time.sleep(5)
            
            # Increment Date
            current_date += timedelta(days=1)
    
    def fetch_previous_two_years(self):
        # Get today's date
        today = datetime.now()
        
        # Calculate the date two years ago
        two_years_ago = (today - timedelta(days=365*2)) + timedelta(days=1)

        # Calculate the end date as yesterday 
        end_date = today - timedelta(days=1)

        # Convert dates to string format 'YYYY-MM-DD'
        start_date_str = two_years_ago.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

        # Fetch data for this range
        print(f"Fetching stock data from {start_date_str} to {end_date_str}...")
        self.fetch_data_for_date_range(start_date_str, end_date_str)