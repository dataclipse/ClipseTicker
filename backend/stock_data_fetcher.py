import requests
import db_manager as db
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import queue
import time

class PolygonStockFetcher:
    def __init__(self, api_key):
        self.database_connect = db.DBManager()
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.max_requests_per_minute = 5
        self.retry_limit = 3
        self.api_call_queue = queue.Queue()
        self.db_insert_queue = queue.Queue()
    
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
        
    def load_stock_data(self, stock_data_batch):
        if stock_data_batch:
            # Batch insertion to optimize database operations
            self.database_connect.insert_stock_batch(stock_data_batch)
            
            #(Old Logic)
            #for stock in stock_data:
            #    timestamp = datetime.now()
            #    self.database_connect.insert_stock(stock['T'], stock['c'], stock['h'], stock['l'], stock['o'], stock['t'], timestamp)

    def fetch_data_for_date(self, date):
        # Fetch stock data for a single date and add it to the database queue.
        stock_data = self.get_stock_data(date)
        if stock_data is not None:
            # Push the data to the db_insert_queue to be inserted later in batches
            self.db_insert_queue.put(stock_data)

    def producer_thread(self, start_date, end_date):
        # Producer thread that generates API calls and fetches stock data concurrently.
        current_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
        request_times = []

        with ThreadPoolExecutor(max_workers=self.max_requests_per_minute) as executor:
            futures = []
            while current_date <= end_date:
                formatted_date = current_date.strftime("%Y-%m-%d")
                if len(request_times) >= self.max_requests_per_minute:
                    time_since_first_request = time.time() - request_times[0]
                    if time_since_first_request < 60:
                        wait_time = 60 - time_since_first_request
                        print(f"Reached request limit. Waiting for {wait_time:.2f} seconds...")
                        time.sleep(wait_time)

                # Submit the task to the ThreadPoolExecutor
                futures.append(executor.submit(self.fetch_data_for_date, formatted_date))

                request_times.append(time.time())
                if len(request_times) > self.max_requests_per_minute:
                    request_times.pop(0)
                
                current_date += timedelta(days=1)
            
            for future in as_completed(futures):
                try:
                    future.result() # This will raise any exception that occurred in the thread
                except Exception as e:
                    print(f"Error in fecthing data: {e}")
            

    def consumer_thread(self):
        # Consumer thread that batches stock data inserts into the database

        batch_size = 100
        buffer = []

        while True:
            try:
                # Block and wait for data from the producer thread
                stock_data = self.db_insert_queue.get(timeout=60) # 60 seconds timeout for waiting

                if stock_data:
                    buffer.extend(stock_data)

                    # Insert when the buffer reaches the batch size

                    if len(buffer) >= batch_size:
                        self.load_stock_data(buffer)
                        print(f"Inserted {len(buffer)} stock entries into the database.")
                        buffer = []

                self.db_insert_queue.task_done()
            
            except queue.Empty:
                # If no data has been recieved for 60 seconds, commit remaining buffer
                if buffer:
                    self.load_stock_data(buffer)
                    print(f"Inserted {len(buffer)} remaining stock entries into the database.")
                    buffer = []
                break # Exit the thread

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
        # Start a timer for timing how long this function will take to run.
        start_time = time.time()

        # Get today's date
        today = datetime.now()
        
        # Calculate the date two years ago
        two_years_ago = (today - timedelta(days=365*2)) + timedelta(days=1)

        # Calculate the end date as yesterday 
        end_date = today - timedelta(days=1)

        # Convert dates to string format 'YYYY-MM-DD'
        start_date_str = two_years_ago.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

        print(f"Fetching data from {start_date_str} to {end_date_str}...")

        producer = threading.Thread(target=self.producer_thread, args=(start_date_str, end_date_str))
        consumer = threading.Thread(target=self.consumer_thread)

        producer.start()
        consumer.start()

        # Wait for both threads to finish
        producer.join()
        self.db_insert_queue.join()
        consumer.join()

        # End the Timer and print the time taken
        end_time = time.time()
        total_time = end_time - start_time
        print(f"Finished fetching data. Time Taken: {total_time:.2f} seconds.")