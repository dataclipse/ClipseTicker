# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timezone, timedelta
import threading
from .db_manager import DBManager
from .data_ingest.polygon_stock_fetcher import PolygonStockFetcher
from .data_ingest.stock_analysis_fetcher import StockAnalysisFetcher
import logging 
logger = logging.getLogger(__name__)


class Scheduler:
    def __init__(self):
        # Initialize the background scheduler
        self.scheduler = BackgroundScheduler()
        self.db_manager = DBManager()
        self.polygon_fetcher = PolygonStockFetcher()
        self.sa_fetcher = StockAnalysisFetcher()
        
    def fetch_scrape_data_task(self, job_id):
        # Task to fetch data for a given job ID.
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s", prefix)
        logger.info("Data Type: %s", job_type)
        logger.info("Job Type: %s", service)
        logger.info("Schedule Type: %s", frequency)
        logger.info("Timestamp: %s", datetime_obj)
        #logger.info("Suffix: %s", interval_suffix)
        #self.sa_fetcher.fetch_and_store_stock_data()

    def fetch_api_data_task(self, job_id):
        # Task to fetch data for a given job ID.
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        logger.info(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        logger.info("Prefix: %s", prefix)
        logger.info("Data Type: %s", job_type)
        logger.info("Job Type: %s", service)
        logger.info("Schedule Type: %s", frequency)
        logger.info("Timestamp: %s", datetime_obj)
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        if (result['job_type'] == 'api_fetch' and result['service'] == 'polygon_io' and result['data_fetch_start_date'] != None ):
            df_start = result['data_fetch_start_date'].strftime('%Y-%m-%d')
            df_end = result['data_fetch_end_date'].strftime('%Y-%m-%d')
            fetch_thread = threading.Thread(target=self.polygon_fetcher.fetch_data_for_date_range, args=(df_start, df_end, job_type, service, frequency, datetime_obj), daemon=True)
            fetch_thread.start()
            if (result['frequency'] == 'recurring_daily'):
                scheduled_start_date = result['scheduled_start_date']
                data_fetch_start_date = result['data_fetch_start_date']
                data_fetch_end_date = result['data_fetch_end_date']
                if isinstance(scheduled_start_date, str):
                    scheduled_start_date = datetime.strptime(scheduled_start_date, "%Y-%m-%d %H:%M:%S")
                if isinstance(data_fetch_start_date, str):
                    data_fetch_start_date = datetime.strptime(data_fetch_start_date, "%Y-%m-%d %H:%M:%S")
                if isinstance(data_fetch_end_date, str):
                    data_fetch_end_date = datetime.strptime(data_fetch_end_date, "%Y-%m-%d %H:%M:%S")
                new_start_date = scheduled_start_date + timedelta(days=1)
                new_data_fetch_start_date = data_fetch_start_date + timedelta(days=1)
                new_data_fetch_end_date = data_fetch_end_date + timedelta(days=1)
                create_new_schedule_iteration = self.db_manager.job_manager.insert_job_schedule(
                    result['job_type'], 
                    result['service'],
                    result['owner'],
                    result['frequency'], 
                    new_start_date,
                    None,
                    new_data_fetch_start_date,
                    new_data_fetch_end_date,
                    None,
                    None
                )
                logger.info(create_new_schedule_iteration)
    
    def disable_interval(self, job_id):
        self.scheduler.remove_job(job_id)
        
    def enable_interval(self, job_id, job):
        self.scheduler.add_job(self.fetch_scrape_data_task, 'interval', minutes=1, args=[job], id=f"{job_id}-interval_job", replace_existing=True)
        
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
            scheduled_end_datetime = job['scheduled_end_date']
            
            # Convert string to datetime object and set to UTC timezone if necessary
            if isinstance(scheduled_start_datetime, str):
                scheduled_start_datetime = datetime.strptime(scheduled_start_datetime, "%Y-%m-%d %H:%M:%S")
            scheduled_start_datetime = scheduled_start_datetime.replace(tzinfo=timezone.utc)
            scheduled_start_timestamp = scheduled_start_datetime.timestamp()
            
            # If the scheduled end datetime exists
            if scheduled_end_datetime:
                # Convert string to datetime object and set to UTC timezone if necessary
                if isinstance(scheduled_end_datetime, str):
                    scheduled_end_datetime = datetime.strptime(scheduled_end_datetime, "%Y-%m-%d %H:%M:%S")
                scheduled_end_datetime = scheduled_end_datetime.replace(tzinfo=timezone.utc)
                
                # Set up trigger to stop the job
                trigger_stop = CronTrigger(
                    year=scheduled_end_datetime.year,
                    month=scheduled_end_datetime.month,
                    day=scheduled_end_datetime.day,
                    hour=scheduled_end_datetime.hour,
                    minute=scheduled_end_datetime.minute,
                    second=scheduled_end_datetime.second,
                    timezone=timezone.utc  
                )
            
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
                    self.scheduler.add_job(
                        self.fetch_api_data_task,
                        trigger=trigger_start,
                        args=[job_id],
                        id=job_id,
                        replace_existing=True
                    )
                    
                if job['job_type'] == 'data_scrape' and job['service'] == 'stock_analysis' and job['frequency'] == 'custom_schedule':
                    # Schedule the job
                    self.scheduler.add_job(self.enable_interval, trigger=trigger_start, args=[job_id, job], id=job_id, replace_existing = True)
                    self.scheduler.add_job(self.disable_interval, trigger=trigger_start, args=[job], id=job_id, replace_existing = True)
                
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