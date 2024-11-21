# db_management/job_manager.py
from sqlalchemy import select, update
from datetime import datetime, timezone
import time
import logging 
logger = logging.getLogger(__name__)

def retry_on_exception(max_retries=3, delay=1):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Retrying {func.__name__} due to error: {e}")
                        time.sleep(delay)
                    else:
                        logger.error(f"Max retries exceeded for {func.__name__}: {e}")
                        raise
        return wrapper
    return decorator

class JobManager:
    def __init__(self, session, jobs_schedule_table):
        # Initialize the session for database interaction
        self.Session = session
        # Set the jobs and jobs_schedule tables for managing job records
        self.jobs_schedule = jobs_schedule_table

    @retry_on_exception()
    def insert_job_schedule(
        self, 
        job_type, 
        service,  
        owner, 
        frequency, 
        scheduled_start_date, 
        scheduled_end_date=None, 
        data_fetch_start_date=None, 
        data_fetch_end_date=None, 
        interval_days=None, 
        weekdays=None, 
        run_time=None
    ):
        # Open a new session for database interaction
        session = self.Session()
        # Set default job status to 'Scheduled'
        status = 'Scheduled'
        try:
            # Prepare an SQL insert statement to add a new job schedule with specified values
            insert_stmt = self.jobs_schedule.insert().values(
                job_type=job_type,
                service=service,
                status=status,
                owner=owner,
                frequency=frequency,
                scheduled_start_date=scheduled_start_date,
                scheduled_end_date=scheduled_end_date,
                data_fetch_start_date=data_fetch_start_date,
                data_fetch_end_date=data_fetch_end_date,
                interval_days=interval_days,
                weekdays=weekdays,
                run_time=run_time,
                created_at=datetime.now(timezone.utc), # Set the current time as the creation time
                updated_at=datetime.now(timezone.utc), # Set the current time as the last update time
            )
            # Execute the insert statement
            session.execute(insert_stmt)
            # Commit the transaction to save changes to the database
            session.commit()
            # Print a success message
            logger.debug(f"The {job_type} for {service} scheduled successfully.")
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            # Print an error message with details
            logger.error(f"Error inserting job '{job_type} for {service}': {e}")
        finally:
            # Close the session to release database resources
            session.close()

    @retry_on_exception()
    def select_job_schedule(self, job_type, service, frequency, scheduled_start_date):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Prepare a SQL select statement to retrieve a job schedule that matches the given parameters
            select_stmt = select(self.jobs_schedule).where(
                self.jobs_schedule.c.job_type == job_type,
                self.jobs_schedule.c.service == service,
                self.jobs_schedule.c.frequency == frequency,
                self.jobs_schedule.c.scheduled_start_date == scheduled_start_date,
            )
            # Execute the select statement
            result = session.execute(select_stmt)
            # Fetch the first matching result (or None if no match found)
            job = result.fetchone()
            # Log a message indicating if the job was found or not
            logger.debug(f"The {job_type} {service} Job exists with a frequency of '{frequency}' starting {scheduled_start_date} exists." if job else "Job not found.")
            # Convert the row to a dictionary, or return None if no job found
            return job._asdict() if job else None
        except Exception as e:
            # Print error details and return None if an exception occurs
            logger.error(f"Error selecting job: {e}")
            return None
        finally:
            # Close the database session to free resources
            session.close()

    @retry_on_exception()
    def delete_job_schedule(self, job_type, service, frequency, scheduled_start_date):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Convert scheduled_start_date to a datetime object if it is provided as a string
            if isinstance(scheduled_start_date, str):
                scheduled_start_date = datetime.strptime(
                    scheduled_start_date, "%a, %d %b %Y %H:%M:%S %Z"
                )
            # Prepare the SQL delete statement with conditions matching job type, service, frequency, and start date
            delete_stmt = self.jobs_schedule.delete().where(
                self.jobs_schedule.c.job_type == job_type,
                self.jobs_schedule.c.service == service,
                self.jobs_schedule.c.frequency == frequency,
                self.jobs_schedule.c.scheduled_start_date == scheduled_start_date,
            )
            # Execute the delete statement
            result = session.execute(delete_stmt)
            # Commit the delete transaction to the database
            session.commit()
            # Check if any rows were affected and print the appropriate message
            if result.rowcount > 0:
                logger.debug(f"The {job_type} {service} Job exists with a frequency of '{frequency}' starting {scheduled_start_date} exists.")
            else:
                logger.debug(f"No {job_type} {service} Job found with a frequency of '{frequency}' starting {scheduled_start_date} exists. Nothing deleted.")
        # Handle any exceptions that occur, roll back the transaction, and print the error
        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting job: {e}")
        finally:
            # Close the database session to free resources
            session.close()

    @retry_on_exception()
    def select_all_job_schedules(self):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Prepare a SQL select statement to retrieve all records from the jobs_schedule table
            select_stmt = select(self.jobs_schedule)
            # Execute the select statement and fetch all results
            result = session.execute(select_stmt)
            jobs = result.fetchall()
            # Extract column names from the jobs table schema
            column_names = [column.name for column in self.jobs_schedule.columns]
            # Convert each row of results into a dictionary, pairing column names with row values
            jobs_list = [dict(zip(column_names, row)) for row in jobs]
            # Print the count of job schedules retrieved or a message if no jobs were found
            logger.debug(f"Retrieved {len(jobs_list)} job schedules." if jobs_list else "No job schedules found.")
            # Return the list of job schedules as a list of dictionaries
            return jobs_list
        except Exception as e:
            # Print error details if an exception occurs and return an empty list
            logger.error(f"Error selecting all job schedules: {e}")
            return []
        finally:
            # Close the database session to free resources
            session.close()

    @retry_on_exception()
    def update_job_schedule(self, job_type, service, frequency, scheduled_start_date, **update_values):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Add current timestamp to update values to track the last update time
            update_values["updated_at"] = datetime.now(timezone.utc)
            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs_schedule)
                .where(
                self.jobs_schedule.c.job_type == job_type,
                self.jobs_schedule.c.service == service,
                self.jobs_schedule.c.frequency == frequency,
                self.jobs_schedule.c.scheduled_start_date == scheduled_start_date,
                )
                .values(**update_values) # Update the job with provided values
            )
            # Execute the update statement
            result = session.execute(update_stmt)
            # Commit the transaction to apply the updates
            session.commit()
            # Check if any rows were affected and print appropriate message
            logger.debug(f"Job {job_type}-{service}-{frequency}-{scheduled_start_date} updated." if result.rowcount else "Job not found.")
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            # Print an error message with details
            logger.error(f"Error updating job: {e}")
        finally:
            # Close the database session to free resources
            session.close()

    @retry_on_exception()
    def update_job_schedule_run_time(self, job_type, service, frequency, scheduled_start_date, run_time):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Define the values to be updated: new run_time and the current timestamp for updated_at
            update_values = {"run_time": run_time, "updated_at": datetime.now(timezone.utc)}
            # Prepare the SQL update statement with conditions 
            update_stmt = (
                update(self.jobs_schedule)
                .where(
                    self.jobs_schedule.c.job_type == job_type,
                    self.jobs_schedule.c.service == service,
                    self.jobs_schedule.c.frequency == frequency,
                    self.jobs_schedule.c.scheduled_start_date == scheduled_start_date,
                )
                .values(**update_values)
            )
            # Execute the update statement
            result = session.execute(update_stmt)
            # Commit the transaction to apply the update
            session.commit()
            # Check if any rows were affected to confirm the update
            if result.rowcount > 0:
                logger.info(f"Job {job_type}-{service}-{frequency}-{scheduled_start_date} run time updated to '{run_time}' successfully.")
            else:
                # Print a message if no matching job was found
                logger.info(f"No job found with name {job_type}-{service}-{frequency}-{scheduled_start_date} scheduled for {scheduled_start_date}.")
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            # Print an error message with details
            logger.error(f"Error updating job run time: {e}")
        finally:
            # Close the database session to free resources
            session.close()

    @retry_on_exception()
    def update_job_schedule_status(self, job_type, service, frequency, scheduled_start_date, status):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Define the values to be updated: new run_time and the current timestamp for updated_at
            update_values = {"status": status, "updated_at": datetime.now(timezone.utc)}
            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs_schedule)
                .where(
                    self.jobs_schedule.c.job_type == job_type,
                    self.jobs_schedule.c.service == service,
                    self.jobs_schedule.c.frequency == frequency,
                    self.jobs_schedule.c.scheduled_start_date == scheduled_start_date,
                )
                .values(**update_values)
            )
            # Execute the update statement
            result = session.execute(update_stmt)
            # Commit the transaction to apply the update
            session.commit()
            # Check if any rows were affected to confirm the update
            if result.rowcount > 0:
                logger.info(f"Job {job_type}-{service}-{frequency}-{scheduled_start_date} status updated to '{status}' successfully.")
            else:
                # Print a message if no matching job was found
                logger.info(f"No job found with name {job_type}-{service}-{frequency}-{scheduled_start_date} scheduled for {scheduled_start_date}.")
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            # Print an error message with details
            logger.error(f"Error updating job run time: {e}")
        finally:
            # Close the database session to free resources
            session.close()

