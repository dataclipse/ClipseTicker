from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timezone
from .db_manager import DBManager
from .data_ingest.polygon_stock_fetcher import PolygonStockFetcher
import logging

class Scheduler:
    def __init__(self):
        # Initialize the background scheduler
        self.scheduler = BackgroundScheduler()
        self.db_manager = DBManager()
        self.polygon_fetcher = PolygonStockFetcher()
        #test_job_id = 'job-api_fetch-polygon_io-once-1732566840'
        #self.fetch_data_task(test_job_id)

    def fetch_data_task(self, job_id):
        # Task to fetch data for a given job ID.
        prefix, job_type, service, frequency, timestamp = job_id.split('-')
        datetime_obj = datetime.fromtimestamp(int(timestamp), timezone.utc)
        print(f"Fetching data for job ID: {job_id} at {datetime.now()}")
        print("Prefix: %s", prefix)
        print("Data Type: %s", job_type)
        print("Job Type: %s", service)
        print("Schedule Type: %s", frequency)
        print("Timestamp: %s", datetime_obj)
        
        result = self.db_manager.job_manager.select_job_schedule(job_type, service, frequency, datetime_obj)
        
        if (result['job_type'] == 'api_fetch' and result['service'] == 'polygon_io' and result['data_fetch_start_date'] == None ):
            self.polygon_fetcher.fetch_previous_two_years()
        
        if (result['job_type'] == 'api_fetch' and result['service'] == 'polygon_io' and result['data_fetch_start_date'] != None ):
            df_start = result['data_fetch_start_date'].strftime('%Y-%m-%d')
            df_end = result['data_fetch_start_date'].strftime('%Y-%m-%d')
            
            self.polygon_fetcher.fetch_data_for_date_range(df_start, df_end)
            
        print(result) 
        
    def schedule_existing_jobs(self):
        # Ensure the scheduler is started
        if not self.scheduler.running:
            self.scheduler.start()
            print("Scheduler started.")
        
        # Query the database for scheduled jobs
        jobs = self.db_manager.job_manager.select_all_job_schedules()
        
        for job in jobs:
            # Convert scheduled_start_date to a UTC timestamp
            scheduled_start_datetime = job['scheduled_start_date']
            
            # If it's a string, convert it to a datetime object
            if isinstance(scheduled_start_datetime, str):
                scheduled_start_datetime = datetime.strptime(scheduled_start_datetime, "%Y-%m-%d %H:%M:%S")
            
            # Convert to UTC if necessary and get the timestamp
            scheduled_start_datetime = scheduled_start_datetime.replace(tzinfo=timezone.utc)
            scheduled_start_timestamp = scheduled_start_datetime.timestamp()
            
            if scheduled_start_datetime > datetime.now(timezone.utc):
                # Set up the trigger
                trigger = CronTrigger(
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

                # Schedule the job
                self.scheduler.add_job(
                    self.fetch_data_task,
                    trigger=trigger,
                    args=[job],
                    id=job_id,
                    replace_existing=True
                )
                
                # Retrieve the job to print its nexxt run time after a brief delay
                scheduled_job = self.scheduler.get_job(job_id)
                if scheduled_job:
                    if scheduled_job.next_run_time:
                        print(f"Next Run Time for {job_id}: {scheduled_job.next_run_time}")
                    else:
                        print(f"No next run time initialized yet for {job_id}")
                else:
                    print(f"{job_id} not found in the scheduler.")
                
    def start_scheduler(self):
        # Start the scheduler if it isn't running already
        if not self.scheduler.running:
            self.scheduler.start()
            print("APScheduler started.")
        
    def stop_scheduler(self):
        # Stop the scheduler
        print("APScheduler Stopped.")
        self.scheduler.shutdown()

if __name__ == "__main__":
    print("Placeholder")