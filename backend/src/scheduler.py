# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.triggers.date import DateTrigger
from apscheduler.events import EVENT_JOB_MISSED
from datetime import datetime, timezone, timedelta
import threading
import time
from .db_manager import DBManager
from .data_ingest.polygon_stock_fetcher import PolygonStockFetcher
from .data_ingest.stock_analysis_fetcher import StockAnalysisFetcher
import logging 
import json
import os
logger = logging.getLogger(__name__)


class Scheduler:
    _instance = None
    _lock = threading.Lock()
    _initialized = False
    _is_shutting_down = False
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance
        
    def __init__(self):
        executors = {
            'default': ThreadPoolExecutor(20) # Adjust thread pool size to handle load
        }
        job_defaults = {
            'misfire_grace_time': 120,  # Allow jobs to run up to 2 minutes late
            'coalesce': False,          # Run all missed jobs, not just the latest one
            'max_instances': 3          # Allow multiple concurrent instances
        }
        
        with self._lock:
            if not self._initialized:
                # Initialize instance attributes only once
                self.scheduler = BackgroundScheduler(executors=executors, job_defaults=job_defaults)
                self.scheduler._daemon = False
                self.db_manager = DBManager()
                self.polygon_fetcher = PolygonStockFetcher()
                self.sa_fetcher = StockAnalysisFetcher()
                self._initialized = True
                self.scheduler.add_listener(self.missed_listener, EVENT_JOB_MISSED)

    def missed_listener(self, event):
        if event.exception:
            # Log error message for the missed job
            logger.error(f"Job {event.job_id} missed, rescheduling...")
            # Attempt to retrieve the missed job from the scheduler
            job = self.scheduler.get_job(event.job_id)
            if job:
                # Reschedule the job to run immediately
                job.modify(next_run_time=datetime.now(timezone.utc))

    def parse_date(self, date_str):
        # Helper function for date conversion
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S") if isinstance(date_str, str) else date_str

    def find_next_scheduled_day(self, current_time, days_list):
        for i in range(1, 8):  # Check the next 7 days
            # Calculate the next day by adding 'i' days to current_time
            next_day = current_time + timedelta(days=i)
            # Check if the weekday of 'next_day' is in days_list
            if next_day.strftime("%a") in days_list:
                return next_day  # Return the datetime object of the next matching day
        return None  # In case no matching day is found within 7 days

    def calculate_next_run_time(self, datetime_obj, days_list):
        # Get the current day as a 3-letter string
        current_day = datetime_obj.strftime("%a")
        if current_day in days_list:
            # Find the index of the current day in days_list
            current_index = days_list.index(current_day)
            
            # Determine the index of the next day in the list (wrap around if necessary)
            next_index = (current_index + 1) % len(days_list)
            next_day_name = days_list[next_index]
            
            # Calculate the number of days until the next occurrence of `next_day_name`
            days_ahead = (days_list.index(next_day_name) - days_list.index(current_day)) % 7
            next_date = datetime_obj + timedelta(days=days_ahead)
        else:
            # If current day is not in days_list, use helper to find the next scheduled day
            next_date = self.find_next_scheduled_day(datetime_obj, days_list)
        
        return next_date

    def list_scheduled_jobs(self):
        # Retrieve all jobs from the scheduler
        jobs = self.scheduler.get_jobs()

        logger.info('Current List of Scheduled Jobs: ')
        logger.info('--------------------------------')
        
        # Log or print each job's information
        if jobs:
            for job in jobs:
                logger.info(f"Job ID: {job.id}, Next Run Time: {job.next_run_time}, Trigger: {job.trigger}")
        else:
            logger.info("No jobs currently scheduled.")

    def fetch_scrape_ticker_data_task(self, job_id):
        # Parse the job ID components
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        
        # Log the job information for debugging
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s, Data Type: %s, Job Type: %s, Schedule Type: %s, Timestamp: %s", prefix, job_type, service, frequency, datetime_obj)
        
        # Update job status to 'Running' before starting data fetch
        self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Running')
        
        # Start a new thread for data fetching
        fetch_thread = threading.Thread(
            target=self.sa_fetcher.fetch_ticker_data,
            args=(job_id,),
            daemon=True
        )
        fetch_thread.start()

    def fetch_scrape_data_task(self, job_id):
        # Parse the job ID components
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        
        # Log the job information for debugging
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s, Data Type: %s, Job Type: %s, Schedule Type: %s, Timestamp: %s", prefix, job_type, service, frequency, datetime_obj)
        
        # Fetch job schedule from the database
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        
        # Handle custom schedule by immediately fetching and storing data
        if frequency == 'custom_schedule':
            # Start a new thread for data fetching
            fetch_thread = threading.Thread(
                target=self.sa_fetcher.fetch_and_store_stock_data,
                args=(),
                daemon=True
            )
            fetch_thread.start()
            #self.sa_fetcher.fetch_and_store_stock_data()
            return
        
        # Handle 'once' or 'recurring_daily' schedules
        if frequency == 'once' or frequency == 'recurring_daily':
            # Update job status to 'Running' before starting data fetch
            self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Running')

            # Record start time for tracking execution duration
            start_time = time.time()
            
            # Start a new thread for data fetching
            fetch_thread = threading.Thread(
                target=self.sa_fetcher.fetch_and_store_stock_data,
                args=(),
                daemon=True
            )
            fetch_thread.start()
            
            # Calculate and log the total time taken
            end_time = time.time()
            total_time = end_time - start_time
            hours, remainder = divmod(total_time, 3600)
            minutes, seconds = divmod(remainder, 60)
            formatted_run_time = f"{int(hours)}h {int(minutes)}m {seconds:.2f}s"
            
            # Update the run time and status to 'Complete' after execution
            self.db_manager.job_manager.update_job_schedule_run_time(job_type, service, frequency, datetime_obj, formatted_run_time)
            self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Complete')
            
            # Log completion details
            logger.info(f"Finished fetching data for Stock Analysis Data Scrape on {datetime_obj}.")
            logger.info(f"Time Taken: {formatted_run_time}")
            
            # For recurring jobs, schedule the next iteration
            if frequency == 'recurring_daily':
                new_start_date = self.parse_date(result['scheduled_start_date']) + timedelta(days=1)

                # Insert a new job schedule iteration with the updated start date
                self.db_manager.job_manager.insert_job_schedule(
                    job_type=result['job_type'],
                    service=result['service'],
                    owner=result['owner'],
                    frequency=frequency,
                    scheduled_start_date=new_start_date,
                    scheduled_end_date=None,
                    data_fetch_start_date=None,
                    data_fetch_end_date=None,
                    interval_days=None,
                    weekdays=None
                )
                logger.info(f"Created new job schedule iteration")
        return

    def fetch_api_data_task(self, job_id):
        # Parse job ID to extract components
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        
        # Log initial information about the job
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s, Data Type: %s, Job Type: %s, Schedule Type: %s, Timestamp: %s", prefix, job_type, service, frequency, datetime_obj)
        
        # Retrieve job schedule details from the database
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        
        # Early exit if conditions are not met for data fetching
        if not (result['job_type'] == 'api_fetch' and result['service'] == 'polygon_io' and result['data_fetch_start_date']):
            return
        
        # Define the start and end dates for data fetching
        df_start = result['data_fetch_start_date'].strftime('%Y-%m-%d')
        df_end = result['data_fetch_end_date'].strftime('%Y-%m-%d')
        
        # Start a new thread for data fetching within the specified date range
        fetch_thread = threading.Thread(
            target=self.polygon_fetcher.fetch_data_for_date_range,
            args=(df_start, df_end, job_type, service, frequency, datetime_obj),
            daemon=True
        )
        fetch_thread.start()
        
        # Proceed to schedule the next job iteration only if it is a recurring job
        if result['frequency'] == 'recurring_daily':
            # Increment start and end dates by one day for the next scheduled iteration
            new_start_date = self.parse_date(result['scheduled_start_date']) + timedelta(days=1)
            new_data_fetch_start_date = self.parse_date(result['data_fetch_start_date']) + timedelta(days=1)
            new_data_fetch_end_date = self.parse_date(result['data_fetch_end_date']) + timedelta(days=1)
            
            # Insert the new job schedule iteration with updated dates
            create_new_schedule_iteration = self.db_manager.job_manager.insert_job_schedule(
                job_type=result['job_type'],
                service=result['service'],
                owner=result['owner'],
                frequency=frequency,
                scheduled_start_date=new_start_date,
                scheduled_end_date=None,
                data_fetch_start_date=new_data_fetch_start_date,
                data_fetch_end_date=new_data_fetch_end_date,
                interval_days=None,
                weekdays=None
            )
            logger.info(f"Created new job schedule iteration: {create_new_schedule_iteration}")

    def disable_interval(self, job_id, start_time):
        # Parse job ID to extract components
        status, prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        
        # Ensure job_id is a string, parse if necessary
        if isinstance(job_id, dict):
            job_id = str(job_id)  # or handle parsing if job_id format is complex
        
        # Remove the job from the scheduler if it exists
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        else:
            logger.warning(f"Job ID {job_id} not found in scheduler.")
        
        # Calculate total run time and format it as hours, minutes, and seconds
        end_time = time.time()
        total_time = end_time - start_time
        hours, remainder = divmod(total_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        formatted_run_time = f"{int(hours)}h {int(minutes)}m {seconds:.2f}s"

        # Update job schedule run time and mark status as 'Complete'
        self.db_manager.job_manager.update_job_schedule_run_time(job_type, service, frequency, datetime_obj, formatted_run_time)
        self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Complete')
        
        # Retrieve current job schedule information
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        
        # Schedule the next iteration if `weekdays` is specified
        if result['weekdays'] != None:
            # Parse `weekdays` and calculate the next scheduled start and end dates
            days_list = json.loads(result['weekdays'])
            next_scheduled_start_date = self.calculate_next_run_time(datetime_obj, days_list)
            next_scheduled_end_date = self.calculate_next_run_time(result['scheduled_end_date'], days_list)
            
            # Insert new job schedule iteration with updated dates
            self.db_manager.job_manager.insert_job_schedule(
                job_type=result['job_type'],
                service=result['service'],
                owner=result['owner'],
                frequency=frequency,
                scheduled_start_date=next_scheduled_start_date,
                scheduled_end_date=next_scheduled_end_date,
                data_fetch_start_date=None,
                data_fetch_end_date=None,
                interval_days=None,
                weekdays=result['weekdays']
            )
            logger.info(f"Created new job schedule iteration")
        
        # Schedule the next iteration if `interval_days` is specified
        if result['interval_days'] != None:
            # Calculate the next start and end dates based on `interval_days`
            new_start_date = self.parse_date(result['scheduled_start_date']) + timedelta(days=result['interval_days'])
            new_end_date = self.parse_date(result['scheduled_end_date']) + timedelta(days=result['interval_days'])
            
            # Insert new job schedule iteration with updated dates
            self.db_manager.job_manager.insert_job_schedule(
                job_type=result['job_type'],
                service=result['service'],
                owner=result['owner'],
                frequency=frequency,
                scheduled_start_date=new_start_date,
                scheduled_end_date=new_end_date,
                data_fetch_start_date=None,
                data_fetch_end_date=None,
                interval_days=result['interval_days'],
                weekdays=None
            )
            logger.info(f"Created new job schedule iteration")

    def enable_interval(self, job_id):
        # Parse job ID to extract components
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        
        # Generate a unique job ID for enabling and track start time
        enable_job_id = f"enable-{job_id}"
        logger.info(f"Enabling job ID: {enable_job_id}")
        start_time = time.time()
        
        # Fetch the job schedule from the database and update the status to 'Running'
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Running')
        
        # Schedule a recurring job to fetch data every minute
        self.scheduler.add_job(self.fetch_scrape_data_task, 'interval', args=[job_id], minutes=5, id=enable_job_id, replace_existing=True)
        logger.info(f"Enabled recurring data fetch task with job ID: {enable_job_id}")
        
        # Retrieve and process the scheduled end datetime
        scheduled_end_datetime = result['scheduled_end_date']
        if isinstance(scheduled_end_datetime, str):
            # Convert to datetime and set to UTC if necessary
            scheduled_end_datetime = datetime.strptime(scheduled_end_datetime, "%Y-%m-%d %H:%M:%S")
        scheduled_end_datetime = scheduled_end_datetime.replace(tzinfo=timezone.utc)
        
        # Define a cron trigger to stop the job at the scheduled end datetime
        trigger_stop = CronTrigger(
                    year=scheduled_end_datetime.year,
                    month=scheduled_end_datetime.month,
                    day=scheduled_end_datetime.day,
                    hour=scheduled_end_datetime.hour,
                    minute=scheduled_end_datetime.minute,
                    second=scheduled_end_datetime.second,
                    timezone=timezone.utc  
                )
        
        # Generate a disable job ID and schedule a job to disable the interval task
        disable_job_id = f"disable-{job_id}"
        self.scheduler.add_job(self.disable_interval, trigger=trigger_stop, args=[enable_job_id, start_time], id=disable_job_id, replace_existing = True)
        logger.info(f"Scheduled disable task for job ID: {disable_job_id} at {scheduled_end_datetime}")

    def schedule_existing_jobs(self):
        # Start the scheduler if it's not already running
        if not self.scheduler.running:
            self.scheduler.start()
            logger.debug("Scheduler started.")
        
        # Query the database for all scheduled jobs
        jobs = self.db_manager.job_manager.select_all_job_schedules()
        
        for job in jobs:
            # Add detailed logging for each job being processed
            logger.info(f"Processing job schedule: Type={job['job_type']}, Service={job['service']}, Frequency={job['frequency']}, Status={job['status']}")
            
            # Convert to UTC datetime
            scheduled_start_datetime = job['scheduled_start_date']
            if isinstance(scheduled_start_datetime, str):
                scheduled_start_datetime = datetime.strptime(scheduled_start_datetime, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            
            # Ensure scheduled_start_datetime is timezone-aware
            if scheduled_start_datetime.tzinfo is None:
                scheduled_start_datetime = scheduled_start_datetime.replace(tzinfo=timezone.utc)

            scheduled_start_timestamp = scheduled_start_datetime.timestamp()
            job_id = f"job-{job['job_type']}-{job['service']}-{job['frequency']}-{int(scheduled_start_timestamp)}"
            
            # Check if the job needs to be restarted
            if scheduled_start_datetime < datetime.now(timezone.utc):
                # Handle API fetch jobs
                if job['job_type'] == 'api_fetch' and job['service'] == 'polygon_io':
                    if job['status'] in ['Running', 'Scheduled']:
                        self.scheduler.add_job(
                            self.fetch_api_data_task,
                            trigger=DateTrigger(run_date=(datetime.now(timezone.utc) + timedelta(seconds=30))),
                            args=[job_id],
                            id=job_id,
                            replace_existing=True
                        )
                        logger.info(f"Restarted API fetch task with job ID: {job_id}.")
                # Handle data scrape jobs
                elif job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis':
                    if job['status'] in ['Running', 'Scheduled']:
                        scheduled_end_datetime = job.get('scheduled_end_date')
                        if scheduled_end_datetime and isinstance(scheduled_end_datetime, str):
                            scheduled_end_datetime = datetime.strptime(scheduled_end_datetime, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                        # Ensure scheduled_end_datetime is timezone-aware
                        if scheduled_end_datetime.tzinfo is None:
                            scheduled_end_datetime = scheduled_end_datetime.replace(tzinfo=timezone.utc)
                        # Check if the scheduled end date is in the future
                        if scheduled_end_datetime > datetime.now(timezone.utc):
                            self.scheduler.add_job(
                                self.enable_interval,
                                trigger=DateTrigger(run_date=(datetime.now(timezone.utc) + timedelta(seconds=30))),
                                args=[job_id],
                                id=job_id,
                                replace_existing=True
                            )
                            logger.info(f"Scheduled enable interval for data scrape task with job ID: {job_id}.")
                # Handle data scrape ticker jobs
                elif job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis_ticker_data':
                    current_time = datetime.now(timezone.utc).time()
                    if job['status'] in ['Running', 'Scheduled']:
                        # Check if current time is greater than 21:00
                        if current_time > datetime.strptime("21:00", "%H:%M").time() and job['frequency'] == 'recurring_daily_am':
                            # Mark job as skipped
                            self.db_manager.job_manager.update_job_schedule_status(job['job_type'], job['service'], job['frequency'], scheduled_start_datetime, 'Skipped')
                            # Schedule for the next day based on the current day
                            tomorrow = datetime.now(timezone.utc).date() + timedelta(days=1)
                            new_start_date = datetime.combine(tomorrow, scheduled_start_datetime.time()).replace(tzinfo=timezone.utc)
                            self.db_manager.job_manager.insert_job_schedule(
                                job_type=job['job_type'],
                                service=job['service'],
                                owner=job['owner'],
                                frequency=job['frequency'],
                                scheduled_start_date=new_start_date,
                                scheduled_end_date=None,
                                data_fetch_start_date=None,
                                data_fetch_end_date=None,
                                interval_days=None,
                                weekdays=None
                            )
                            logger.info(f"Job ID: {job_id} marked as skipped and rescheduled for the next day.")
                            continue  # Skip further processing for this job
                        
                        if datetime.strptime("09:00", "%H:%M").time() <= current_time <= datetime.strptime("11:00", "%H:%M").time():
                            # Mark job as skipped
                            self.db_manager.job_manager.update_job_schedule_status(job['job_type'], job['service'], job['frequency'], scheduled_start_datetime, 'Skipped')
                            # Schedule for the current day with the same time
                            today = datetime.now(timezone.utc).date()
                            new_start_date = datetime.combine(today, scheduled_start_datetime.time()).replace(tzinfo=timezone.utc)
                            self.db_manager.job_manager.insert_job_schedule(
                                job_type=job['job_type'],
                                service=job['service'],
                                owner=job['owner'],
                                frequency=job['frequency'],
                                scheduled_start_date=new_start_date,
                                scheduled_end_date=None,
                                data_fetch_start_date=None,
                                data_fetch_end_date=None,
                                interval_days=None,
                                weekdays=None
                            )
                            logger.info(f"Job ID: {job_id} marked as skipped and rescheduled for today.")
                            continue  # Skip further processing for this job
                        
                        # Restart the job for any other time
                        self.scheduler.add_job(
                            self.fetch_scrape_ticker_data_task,
                            trigger=DateTrigger(run_date=datetime.now(timezone.utc) + timedelta(seconds=30)),  
                            args=[job_id],
                            id=job_id,
                            replace_existing=True
                        )
                        logger.info(f"Job ID: {job_id} restarted for fetch_scrape_ticker_data_task.")
                        
            # Only schedule jobs with a start date in the future
            if scheduled_start_datetime > datetime.now(timezone.utc):
                trigger_start = CronTrigger(
                    year=scheduled_start_datetime.year,
                    month=scheduled_start_datetime.month,
                    day=scheduled_start_datetime.day,
                    hour=scheduled_start_datetime.hour,
                    minute=scheduled_start_datetime.minute,
                    second=scheduled_start_datetime.second,
                    timezone=timezone.utc  
                )
                # Schedule API fetch jobs
                if job['job_type'] == 'api_fetch' and job['service'] == 'polygon_io':
                    self.scheduler.add_job(self.fetch_api_data_task, trigger=trigger_start, args=[job_id], id=job_id, replace_existing=True)
                    logger.info(f"Scheduled API fetch task with job ID: {job_id}")
                # Schedule data scrape jobs
                elif job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis':
                    if job['frequency'] == 'custom_schedule':
                        self.scheduler.add_job(self.enable_interval, trigger=trigger_start, args=[job_id], id=job_id, replace_existing=True)
                        logger.info(f"Scheduled data scrape task with job ID: {job_id}")
                    else:
                        self.scheduler.add_job(self.fetch_scrape_data_task, trigger=trigger_start, args=[job_id], id=job_id, replace_existing=True)
                        logger.info(f"Scheduled data scrape task with job ID: {job_id}")
                # Schedule data scrape ticker jobs
                elif job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis_ticker_data':
                    self.scheduler.add_job(self.fetch_scrape_ticker_data_task, trigger=trigger_start, args=[job_id], id=job_id, replace_existing=True)
                    logger.info(f"Scheduled API fetch task with job ID: {job_id}")
                    
    def start_scheduler(self):
        # Start the scheduler if it isn't running already
        if not self.scheduler.running:
            self.scheduler.start()
            logger.debug("APScheduler started.")

    def stop_scheduler(self):
        # Use class lock to prevent race conditions
        with self._lock:
            # Only stop if the scheduler is running and not already shutting down
            if self.scheduler.running and not self._is_shutting_down:
                self._is_shutting_down = True
                logger.debug("APScheduler Stopped.")
                self.scheduler.shutdown(wait=False)

    def inspect_job(self, job_id):
        # Check scheduler for the job with the given job_id
        scheduled_job = self.scheduler.get_job(job_id)
        logger.info(f"\nJob Inspection for {job_id}:")
        logger.info("------------------------")
        
        if scheduled_job:
            # If the job is found in the scheduler, log its details
            logger.info("Scheduler Status:")
            logger.info(f"- Next Run Time: {scheduled_job.next_run_time}")
            logger.info(f"- Trigger: {scheduled_job.trigger}")
            logger.info(f"- Function: {scheduled_job.func.__name__}")
        else:
            # If the job is not found, log that information
            logger.info("Job not found in scheduler")
        
        # Check the database for job details
        try:
            # Parse job ID to extract components
            parts = job_id.split('-')
            if len(parts) >= 5:
                job_type = parts[1]
                service = parts[2]
                frequency = parts[3]
                timestamp = int(parts[4])
                datetime_obj = datetime.fromtimestamp(timestamp, timezone.utc)
                
                # Query the database for the job schedule using extracted components
                db_job = self.db_manager.job_manager.select_job_schedule(
                    job_type, service, frequency, datetime_obj
                )
                
                if db_job:
                    # If the job is found in the database, log its details
                    logger.info("\nDatabase Status:")
                    logger.info(f"- Status: {db_job['status']}")
                    logger.info(f"- Start Date: {db_job['scheduled_start_date']}")
                    logger.info(f"- End Date: {db_job['scheduled_end_date']}")
                else:
                    # If the job is not found in the database, log that information
                    logger.info("Job not found in database")
        except Exception as e:
            # Log any error that occurs during the database inspection
            logger.error(f"Error inspecting database record: {e}")

    def add_ticker_data_jobs(self):
        # Define job parameters
        job_type = 'data_scrape'
        service = 'stock_analysis_ticker_data'
        owner = 'AutoGen'
        frequency_am = 'recurring_daily_am'
        frequency_pm = 'recurring_daily_pm'
        
        # Get current UTC time for comparison
        current_time = datetime.now(timezone.utc)
        
        # Set scheduled times for AM (11:00 UTC) and PM (23:00 UTC) jobs
        scheduled_start_utc_am = datetime.now(timezone.utc).replace(hour=11, minute=0, second=0, microsecond=0)
        scheduled_start_utc_pm = datetime.now(timezone.utc).replace(hour=23, minute=0, second=0, microsecond=0)
        
        # Check if the scheduled AM time has already passed
        if scheduled_start_utc_am <= current_time:
            scheduled_start_utc_am += timedelta(days=1)  # Move to the next day
            
        # Check if the scheduled PM time has already passed
        if scheduled_start_utc_pm <= current_time:
            scheduled_start_utc_pm += timedelta(days=1)  # Move to the next day

        # Check and schedule AM job if it doesn't exist
        existing_job_am = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency_am, scheduled_start_utc_am)
        if not existing_job_am:
            self.db_manager.job_manager.insert_job_schedule(
                job_type, service, owner, frequency_am, scheduled_start_utc_am,
                None, None, None, None, None
            )
            logger.info("Scheduled new ticker data job for AM.")
        else:
            logger.info("A job is already scheduled for AM; no new job created.")
            
        # Check and schedule PM job if it doesn't exist
        existing_job_pm = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency_pm, scheduled_start_utc_pm)
        if not existing_job_pm:
            self.db_manager.job_manager.insert_job_schedule(
                job_type, service, owner, frequency_pm, scheduled_start_utc_pm,
                None, None, None, None, None
            )
            logger.info("Scheduled new ticker data job for PM.")
        else:
            logger.info("A job is already scheduled for PM; no new job created.")

if __name__ == "__main__":
    logger.debug("Placeholder")