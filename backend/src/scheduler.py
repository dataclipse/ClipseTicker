# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timezone, timedelta
import threading
import time
from .db_manager import DBManager
from .data_ingest.polygon_stock_fetcher import PolygonStockFetcher
from .data_ingest.stock_analysis_fetcher import StockAnalysisFetcher
import logging 
import json
logger = logging.getLogger(__name__)


class Scheduler:
    def __init__(self):
        # Initialize the background scheduler
        self.scheduler = BackgroundScheduler()
        self.db_manager = DBManager()
        self.polygon_fetcher = PolygonStockFetcher()
        self.sa_fetcher = StockAnalysisFetcher()
    
    def parse_date(self, date_str):
        # Helper function for date conversion
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S") if isinstance(date_str, str) else date_str
    
    def find_next_scheduled_day(self, current_time, days_list):
        for i in range(1, 8):  # Check the next 7 days
            next_day = current_time + timedelta(days=i)
            if next_day.strftime("%a") in days_list:
                return next_day  # Return the datetime of the next matching day
    
    def calculate_next_run_time(self, datetime_obj, days_list):
        current_day = datetime_obj.strftime("%a")
        if current_day in days_list:
            # Find the index of the current day
            current_index = days_list.index(current_day)
            # Calculate the index of the next day, wrapping around to the start if needed
            next_index = (current_index + 1) % len(days_list)
            next_day_name = days_list[next_index]
            
            # Calculate the datetime of the next occurrence of `next_day_name`
            days_ahead = (days_list.index(next_day_name) - days_list.index(current_day)) % 7
            next_date = datetime_obj + timedelta(days=days_ahead)
        else:
            # Find the next available day in the list
            next_date = self.find_next_scheduled_day(datetime_obj, days_list)
        
        return next_date

    def fetch_scrape_data_task(self, job_id):
        # Task to fetch data for a given job ID.
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s, Data Type: %s, Job Type: %s, Schedule Type: %s, Timestamp: %s", prefix, job_type, service, frequency, datetime_obj)
        #logger.info("Suffix: %s", interval_suffix)
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        
        if frequency == 'custom_schedule':
            # Fetch current data
            self.sa_fetcher.fetch_and_store_stock_data()
            return
        
        if frequency == 'once' or frequency == 'recurring_daily':
            start_time = time.time()
            self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Running')
            
            self.sa_fetcher.fetch_and_store_stock_data()
            
            end_time = time.time()
            total_time = end_time - start_time
            
            # Convert runtime to hours, minutes, and seconds format
            hours, remainder = divmod(total_time, 3600)
            minutes, seconds = divmod(remainder, 60)
            formatted_run_time = f"{int(hours)}h {int(minutes)}m {seconds:.2f}s"
            
            self.db_manager.job_manager.update_job_schedule_run_time(job_type, service, frequency, datetime_obj, formatted_run_time)
            self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Complete')
            
            # Log completion message with total time taken
            logger.info(f"Finished fetching data for Stock Analysis Data Scrape on {datetime_obj}.")
            logger.info(f"Time Taken: {formatted_run_time}")
            
            if frequency == 'recurring_daily':
                new_start_date = self.parse_date(result['scheduled_start_date']) + timedelta(days=1)

                # Insert new job schedule iteration with updated dates
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
        # Task to fetch data for a given job ID.
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s, Data Type: %s, Job Type: %s, Schedule Type: %s, Timestamp: %s", prefix, job_type, service, frequency, datetime_obj)
        
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        
        # Early exit if the conditions for data fetching are not met
        if not (result['job_type'] == 'api_fetch' and result['service'] == 'polygon_io' and result['data_fetch_start_date']):
            return
        
        # Fetch data for the current date range
        df_start = result['data_fetch_start_date'].strftime('%Y-%m-%d')
        df_end = result['data_fetch_end_date'].strftime('%Y-%m-%d')
        
        fetch_thread = threading.Thread(
            target=self.polygon_fetcher.fetch_data_for_date_range,
            args=(df_start, df_end, job_type, service, frequency, datetime_obj),
            daemon=True
        )
        fetch_thread.start()
        
        # Proceed with scheduling new iterations only for recurring daily jobs
        if result['frequency'] == 'recurring_daily':
            # Update start and end dates by 1 day
            new_start_date = self.parse_date(result['scheduled_start_date']) + timedelta(days=1)
            new_data_fetch_start_date = self.parse_date(result['data_fetch_start_date']) + timedelta(days=1)
            new_data_fetch_end_date = self.parse_date(result['data_fetch_end_date']) + timedelta(days=1)
            
            # Insert new job schedule iteration with updated dates
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
        status, prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        self.scheduler.remove_job(job_id)
        end_time = time.time()
        total_time = end_time - start_time
        
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        # Convert runtime to hours, minutes, and seconds format
        hours, remainder = divmod(total_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        formatted_run_time = f"{int(hours)}h {int(minutes)}m {seconds:.2f}s"
        
        self.db_manager.job_manager.update_job_schedule_run_time(job_type, service, frequency, datetime_obj, formatted_run_time)
        self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Complete')
        
        if result['weekdays'] != None:
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
            
        if result['interval_days'] != None:
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
        # Task to fetch data for a given job ID.
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        enable_job_id = f"enable-{job_id}"
        start_time = time.time()
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        self.db_manager.job_manager.update_job_schedule_status(job_type, service, frequency, datetime_obj, 'Running')
        self.scheduler.add_job(self.fetch_scrape_data_task, 'interval', args=[job_id], minutes=1, id=enable_job_id, replace_existing=True)
        
        scheduled_end_datetime = result['scheduled_end_date']
        # Convert string to datetime object and set to UTC timezone if necessary
        if isinstance(scheduled_end_datetime, str):
            scheduled_end_datetime = datetime.strptime(scheduled_end_datetime, "%Y-%m-%d %H:%M:%S")
        scheduled_end_datetime = scheduled_end_datetime.replace(tzinfo=timezone.utc)
        trigger_stop = CronTrigger(
                    year=scheduled_end_datetime.year,
                    month=scheduled_end_datetime.month,
                    day=scheduled_end_datetime.day,
                    hour=scheduled_end_datetime.hour,
                    minute=scheduled_end_datetime.minute,
                    second=scheduled_end_datetime.second,
                    timezone=timezone.utc  
                )
        disable_job_id = f"disable-{job_id}"
        self.scheduler.add_job(self.disable_interval, trigger=trigger_stop, args=[enable_job_id, start_time], id=disable_job_id, replace_existing = True)
        
    def schedule_existing_jobs(self):
        # Ensure the scheduler is started
        if not self.scheduler.running:
            self.scheduler.start()
            logger.debug("Scheduler started.")
        
        # Query the database for scheduled jobs
        jobs = self.db_manager.job_manager.select_all_job_schedules()
        
        for job in jobs:
            # Convert scheduled_start_date to a UTC timestamp
            scheduled_start_datetime = job['scheduled_start_date']
            
            # Convert string to datetime object and set to UTC timezone if necessary
            if isinstance(scheduled_start_datetime, str):
                scheduled_start_datetime = datetime.strptime(scheduled_start_datetime, "%Y-%m-%d %H:%M:%S")
            scheduled_start_datetime = scheduled_start_datetime.replace(tzinfo=timezone.utc)
            scheduled_start_timestamp = scheduled_start_datetime.timestamp()
            
            if scheduled_start_datetime > datetime.now(timezone.utc):
                # Set up the trigger
                trigger_start = CronTrigger(
                    year=scheduled_start_datetime.year,
                    month=scheduled_start_datetime.month,
                    day=scheduled_start_datetime.day,
                    hour=scheduled_start_datetime.hour,
                    minute=scheduled_start_datetime.minute,
                    second=scheduled_start_datetime.second,
                    timezone=timezone.utc  
                )
                
                # Set up a unique job ID for each task in APScheduler
                job_id = f"job-{job['job_type']}-{job['service']}-{job['frequency']}-{int(scheduled_start_timestamp)}"
                
                if job['job_type'] == 'api_fetch' and job['service'] == 'polygon_io':
                    # Schedule the job
                    self.scheduler.add_job(self.fetch_api_data_task, trigger=trigger_start, args=[job_id], id=job_id, replace_existing=True)
                    
                if job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis' and job['frequency'] == 'custom_schedule':
                    # Schedule the job
                    self.scheduler.add_job(self.enable_interval, trigger=trigger_start, args=[job_id], id=job_id, replace_existing = True)
                
                if job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis' and job['frequency'] != 'custom_schedule':
                    # Schedule the job
                    self.scheduler.add_job(self.fetch_scrape_data_task, trigger=trigger_start, args=[job_id], id=job_id, replace_existing=True)
                
                # Retrieve the job to logger.debug its next run time after a brief delay
                scheduled_job = self.scheduler.get_job(job_id)
                if scheduled_job:
                    if scheduled_job.next_run_time:
                        logger.info(f"Next Run Time for {job_id}: {scheduled_job.next_run_time}")
                    else:
                        logger.debug(f"No next run time initialized yet for {job_id}")
                else:
                    logger.debug(f"{job_id} not found in the scheduler.")
                
    def start_scheduler(self):
        # Start the scheduler if it isn't running already
        if not self.scheduler.running:
            self.scheduler.start()
            logger.debug("APScheduler started.")
        
    def stop_scheduler(self):
        # Stop the scheduler
        logger.debug("APScheduler Stopped.")
        self.scheduler.shutdown()

if __name__ == "__main__":
    logger.debug("Placeholder")