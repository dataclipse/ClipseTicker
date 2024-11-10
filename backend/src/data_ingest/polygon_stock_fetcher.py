# data_ingest/polygon_stock_fetcher.py
import requests, threading, queue, time
from ..db_manager import DBManager
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging


class PolygonStockFetcher:
    def __init__(self):
        
        # Initialize a connection to the database through DBManager
        self.database_connect = DBManager()
        
        # Retrieve the API key for Polygon.io from the database
        self.polygon_api_key = self.database_connect.api_key_manager.select_api_key("Polygon.io")
        
        # Set the base URL for Polygon.io's API
        self.base_url = "https://api.polygon.io"
        
        # Set the maximum number of requests allowed per minute to prevent API rate limiting
        self.max_requests_per_minute = 5
        
        # Define the limit for retrying failed requests
        self.retry_limit = 3
        
        # Initialize a queue to manage API calls, ensuring rate limits are respected
        self.api_call_queue = queue.Queue()
        
        # Initialize a queue to handle database inserts asynchronously
        self.db_insert_queue = queue.Queue()

    def get_stock_data(self, date):
        # Refresh the API key to ensure the latest key is used for the request
        self.polygon_api_key = self.database_connect.api_key_manager.select_api_key("Polygon.io")
        
        # Define the API endpoint and URL for retrieving stock data for a specific date
        endpoint = f"/v2/aggs/grouped/locale/us/market/stocks/{date}"
        url = self.base_url + endpoint
        params = {"adjusted": "true", "apikey": self.polygon_api_key} # Set query parameters
        
        # Send the API request to the specified URL with the query parameters
        response = requests.get(url, params=params)
        data = response.json() # Parse the response as JSON

        # Check if the response status is successful (status code 200)
        if response.status_code == 200:
            # If results are present, return them
            if data.get("resultsCount", 0) > 0:
                return data["results"]
            else:
                # Print message if no data is available, likely due to market closure on the date
                print(f"No stock data found for {date}.")
                return []
            
        # Handle rate limit errors (status code 429)
        elif response.status_code == 429:
            # Handle rate limit error (429 Too Many Requests)
            print("Rate limit exceeded. Waiting for 60 seconds before retrying...")
            time.sleep(60)  # Wait for 60 seconds before retrying
            return None
        
        # Handle other errors by printing the status and error message
        else:
            # If the response status is not 200, raise an error
            print(f"Error fetching data: {response.status_code} - {response.text}")
            return None

    def load_stock_data(self, stock_data_batch):
        # Check if stock data batch is not empty
        if stock_data_batch:
            # Perform batch insertion to improve database operation efficiency
            self.database_connect.stock_manager.insert_stock_batch(stock_data_batch)

    def producer_thread(self, start_date, end_date):
        # Producer thread to fetch stock data concurrently for a date range
        current_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
        request_times = [] # Track request timestamps to manage rate limits

        # Use ThreadPoolExecutor to run multiple threads, up to the max requests per minute
        with ThreadPoolExecutor(max_workers=self.max_requests_per_minute) as executor:
            futures = []
            while current_date <= end_date:
                # Format the current date for the API request
                formatted_date = current_date.strftime("%Y-%m-%d")
                
                # Check if request limit is reached
                if len(request_times) >= self.max_requests_per_minute:
                    time_since_first_request = time.time() - request_times[0]
                    is_last_date = current_date == end_date

                    # If limit is reached and not on the last date, wait for the remaining time
                    if not is_last_date and time_since_first_request < 60:
                        wait_time = 60 - time_since_first_request
                        print(f"Reached request limit. Waiting for {wait_time:.2f} seconds...")
                        time.sleep(wait_time)

                # Submit the data fetch task to the ThreadPoolExecutor
                futures.append(
                    executor.submit(self.fetch_data_for_date, formatted_date)
                )

                # Log the request time and manage the request timing list for rate limiting
                request_times.append(time.time())
                if len(request_times) > self.max_requests_per_minute:
                    request_times.pop(0) # Remove the oldest request time if over limit

                # Move to the next date in the range
                current_date += timedelta(days=1)

            # Process completed tasks and handle any errors that occur in threads
            for future in as_completed(futures):
                try:
                    future.result()  # Raises any exception that occurred during the task
                except Exception as e:
                    print(f"Error in fetching data: {e}")

    def consumer_thread(self):
        # Consumer thread that batches and inserts stock data into the database

        batch_size = 100 # Define batch size for database insertion
        buffer = [] # Buffer to accumulate stock data for batch insertion

        while True:
            try:
                # Wait for stock data from the producer thread, with a 60-second timeout
                stock_data = self.db_insert_queue.get(timeout=60) 

                # If data is received, add it to the buffer
                if stock_data:
                    buffer.extend(stock_data)

                    # If buffer reaches batch size, insert data into the database
                    if len(buffer) >= batch_size:
                        self.load_stock_data(buffer) # Insert the batch
                        print(f"Inserted {len(buffer)} stock entries into the database.")
                        buffer = [] # Clear the buffer after insertion

                # Mark the task as done in the queue
                self.db_insert_queue.task_done()

            except queue.Empty:
                # If no data has been received within 60 seconds, insert remaining buffer
                if buffer:
                    self.load_stock_data(buffer) # Insert remaining data
                    print(f"Inserted {len(buffer)} remaining stock entries into the database.")
                    buffer = [] # Clear the buffer after insertion
                break  # Exit the consumer thread

    def fetch_data_for_date(self, date):
        # Fetch stock data for a single date and add it to the database queue
        
        # Call the function to get stock data for the specified date
        stock_data = self.get_stock_data(date)
        
        # If stock data is retrieved successfully, add it to the database insert queue
        if stock_data is not None:
            # Place the data in db_insert_queue to be processed later by the consumer thread in batches
            self.db_insert_queue.put(stock_data)

    def fetch_data_for_date_range(self, start_date, end_date):
        # Fetch stock data for a specified date range using a producer-consumer threading model
        
        start_time = time.time() # Start timer to track total runtime
        job_name = f"Fetch Data for Date Range: {start_date} to {end_date}"
        scheduled_start_time = datetime.now().replace(microsecond=0) # Current time as job start time

        # Initialize job entry in the database with "Scheduled" status if it doesn't exist
        self.job_init(job_name, scheduled_start_time, "Scheduled")

        # Update job status to "Running" and set start time in the database
        self.database_connect.job_manager.update_job_status(
            job_name, scheduled_start_time, "Running"
        )
        self.database_connect.job_manager.update_job_start_time(
            job_name, scheduled_start_time, scheduled_start_time
        )

        print(f"Fetching stock data from {start_date} to {end_date}...")

        # Initialize producer and consumer threads
        producer = threading.Thread(
            target=self.producer_thread, args=(start_date, end_date)
        )
        consumer = threading.Thread(target=self.consumer_thread)

        # Start the threads
        producer.start()
        consumer.start()

        # Wait for producer to finish and ensure consumer has processed all data
        producer.join() # Wait for producer to finish
        self.db_insert_queue.join() # Ensure all items in queue are processed by the consumer
        consumer.join() # Wait for consumer to finish processing

        # Calculate the total runtime
        end_time = time.time()
        total_time = end_time - start_time

        # Convert runtime to hours, minutes, and seconds format
        hours, remainder = divmod(total_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        formatted_run_time = f"{int(hours)}h {int(minutes)}m {seconds:.2f}s"

        # Update job end time, run time, and set status to "Completed" in the database
        self.database_connect.job_manager.update_job_end_time(
            job_name, scheduled_start_time, datetime.now()
        )
        self.database_connect.job_manager.update_job_run_time(
            job_name, scheduled_start_time, formatted_run_time
        )
        self.database_connect.job_manager.update_job_status(
            job_name, scheduled_start_time, "Completed"
        )

        # Log completion message with total time taken
        print(f"Finished fetching data for date range {start_date} to {end_date}.")
        print(f"Time Taken: {formatted_run_time}")

    def fetch_previous_two_years(self):
        # Start a timer to measure the runtime of the function
        start_time = time.time()

        # Get today's date and calculate the date two years ago (plus one day for range inclusion)
        today = datetime.now()
        two_years_ago = (today - timedelta(days=365 * 2)) + timedelta(days=1)

        # Set the end date as yesterday to avoid fetching today’s incomplete data
        end_date = today - timedelta(days=1)

        # Format dates to 'YYYY-MM-DD' string for API compatibility
        start_date_str = two_years_ago.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

        # Define the job name based on the date range and get the scheduled start time
        job_name = f"Fetch Previous Two Years: {start_date_str} to {end_date_str}"
        scheduled_start_time = datetime.now().replace(microsecond=0)

        # Initialize job in the database with status "Scheduled" if it doesn't exist
        self.job_init(job_name, scheduled_start_time, "Scheduled")

        # Update the job status to "Running" and record the start time in the database
        self.database_connect.job_manager.update_job_status(
            job_name, scheduled_start_time, "Running"
        )
        self.database_connect.job_manager.update_job_start_time(
            job_name, scheduled_start_time, scheduled_start_time
        )

        print(f"Fetching data from {start_date_str} to {end_date_str}...")

        # Initialize producer and consumer threads for fetching and inserting data
        producer = threading.Thread(
            target=self.producer_thread, args=(start_date_str, end_date_str)
        )
        consumer = threading.Thread(target=self.consumer_thread)

        # Start the producer and consumer threads
        producer.start()
        consumer.start()

        # Wait for the producer to finish and ensure the consumer processes all data
        producer.join() # Wait for producer thread to finish fetching
        self.db_insert_queue.join() # Ensure all queued data is processed by consumer
        consumer.join() # Wait for consumer thread to finish

        # Calculate the total runtime
        end_time = time.time()
        total_time = end_time - start_time

        # Format runtime into hours, minutes, and seconds for readability
        hours, remainder = divmod(total_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        formatted_run_time = f"{int(hours)}h {int(minutes)}m {seconds:.2f}s"

        # Update job end time, run time, and status to "Completed" in the database
        self.database_connect.job_manager.update_job_end_time(
            job_name, scheduled_start_time, datetime.now()
        )
        self.database_connect.job_manager.update_job_run_time(
            job_name, scheduled_start_time, formatted_run_time
        )
        self.database_connect.job_manager.update_job_status(
            job_name, scheduled_start_time, "Completed"
        )

        # Print the completion message and formatted runtime
        print(f"Finished fetching data. Time Taken: {formatted_run_time}")

    def job_init(self, job_name, scheduled_start_time, status):
        # Check if a job entry with the same name and scheduled start time already exists
        existing_job = self.database_connect.job_manager.select_job(
            job_name, scheduled_start_time
        )
        if not existing_job:
            # If the job does not exist, insert it with the provided status
            self.database_connect.job_manager.insert_job(
                job_name, scheduled_start_time, status
            )
        else:
            # Log a message if the job entry already exists in the database
            print(f"Job '{job_name}' scheduled at {scheduled_start_time} already exists.")
