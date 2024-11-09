# db_management/job_manager.py
from sqlalchemy import select, update
from datetime import datetime


class JobManager:
    def __init__(self, session, jobs_table, jobs_schedule_table):
        # Initialize the session for database interaction
        self.Session = session
        
        # Set the jobs and jobs_schedule tables for managing job records
        self.jobs = jobs_table
        self.jobs_schedule = jobs_schedule_table

    def select_all_jobs(self):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Prepare an SQL select statement to retrieve all records from the jobs table
            select_stmt = select(self.jobs)
            
            # Execute the select statement and fetch all results
            result = session.execute(select_stmt)
            jobs = result.fetchall()
            
            # Extract column names from the jobs table schema
            column_names = [column.name for column in self.jobs.columns]
            
            # Convert each row of results into a dictionary, pairing column names with row values
            jobs_list = [dict(zip(column_names, row)) for row in jobs]

            # Print the count of jobs retrieved or a message if no jobs were found
            print(
                f"Retrieved {len(jobs_list)} jobs." if jobs_list else "No jobs found."
            )
            
            # Return the list of jobs as a list of dictionaries
            return jobs_list
        
        except Exception as e:
            # Print error details if an exception occurs and return an empty list
            print(f"Error selecting all jobs: {e}")
            return []
        
        finally:
            # Close the database session to free resources
            session.close()

    def select_job(self, job_name, scheduled_start_time):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Prepare an SQL select statement to find a job with the specified job name and scheduled start time
            select_stmt = select(self.jobs).where(
                self.jobs.c.job_name == job_name,
                self.jobs.c.scheduled_start_time == scheduled_start_time,
            )
            
            # Execute the select statement
            result = session.execute(select_stmt)
            
            # Fetch the first matching result (or None if no match is found)
            job = result.fetchone()
            
            # Print a message indicating if the job was found or not
            print(f"Job {job_name} exists." if job else "Job not found.")
            
            # Return the job data as a dictionary if found, otherwise return None
            return dict(job) if job else None
        
        except Exception as e:
            # Print an error message if an exception occurs
            print(f"Error selecting job: {e}")
            
            # Return None in case of an error
            return None
        
        finally:
            # Close the database session to free resources
            session.close()

    def update_job(self, job_name, scheduled_start_time, **update_values):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Add current timestamp to update values to track the last update time
            update_values["updated_at"] = datetime.now()
            
            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time,
                )
                .values(**update_values) # Update the job with provided values
            )
            
            # Execute the update statement
            result = session.execute(update_stmt)
            
            # Commit the transaction to apply the updates
            session.commit()
            
            # Check if any rows were affected and print appropriate message
            print(f"Job {job_name} updated." if result.rowcount else "Job not found.")
            
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details
            print(f"Error updating job: {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

    def delete_job(self, job_name, scheduled_start_time):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Convert scheduled_start_time to a datetime object if it is provided as a string
            if isinstance(scheduled_start_time, str):
                scheduled_start_time = datetime.strptime(
                    scheduled_start_time, "%a, %d %b %Y %H:%M:%S %Z"
                )

            # Prepare the SQL delete statement to remove a job with matching job name and scheduled start time
            delete_stmt = self.jobs.delete().where(
                self.jobs.c.job_name == job_name,
                self.jobs.c.scheduled_start_time == scheduled_start_time,
            )

            # Execute the delete statement
            result = session.execute(delete_stmt)

            # Commit the transaction to apply the delete operation
            session.commit()

            # Check if any rows were affected to confirm deletion
            if result.rowcount > 0:
                print(f"Job {job_name} deleted successfully.")
            else:
                # Print a message if no matching job was found
                print(
                    f"No job found with name '{job_name}' and scheduled start time {scheduled_start_time}. Nothing deleted."
                )

        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details
            print(f"Error deleting job: {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

    def insert_job(
        self,
        job_name,
        scheduled_start_time,
        status,
        start_time=None,
        end_time=None,
        run_time=None,
    ):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Prepare an SQL insert statement to add a new job with specified values
            insert_stmt = self.jobs.insert().values(
                job_name=job_name,
                scheduled_start_time=scheduled_start_time,
                status=status,
                start_time=start_time,
                end_time=end_time,
                run_time=run_time,
                created_at=datetime.now(), # Set the current time as the creation time
                updated_at=datetime.now(), # Set the current time as the last update time
            )
            
            # Execute the insert statement
            session.execute(insert_stmt)
            
            # Commit the transaction to save the new job record in the database
            session.commit()
            
            # Print a success message to indicate the job was inserted
            print(f"Job {job_name} inserted successfully.")
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details of the exception
            print(f"Error inserting job '{job_name}': {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

    def update_job_run_time(self, job_name, scheduled_start_time, run_time):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Define the values to be updated: new run_time and the current timestamp for updated_at
            update_values = {"run_time": run_time, "updated_at": datetime.now()}

            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time,
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            
            # Commit the transaction to apply the update
            session.commit()

            # Check if any rows were affected to confirm the update
            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' run time updated to '{run_time}' successfully."
                )
            else:
                # Print a message if no matching job was found
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
                
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details
            print(f"Error updating job run time: {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

    def update_job_end_time(self, job_name, scheduled_start_time, end_time):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Define the values to be updated: new end_time and the current timestamp for updated_at
            update_values = {"end_time": end_time, "updated_at": datetime.now()}

            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time,
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            
            # Commit the transaction to apply the update
            session.commit()

            # Check if any rows were affected to confirm the update
            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' end time updated to '{end_time}' successfully."
                )
            else:
                # Print a message if no matching job was found
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details
            print(f"Error updating job end time: {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

    def update_job_start_time(self, job_name, scheduled_start_time, start_time):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Define the values to be updated: new start_time and the current timestamp for updated_at
            update_values = {"start_time": start_time, "updated_at": datetime.now()}

            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time,
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            
            # Commit the transaction to apply the update
            session.commit()

            # Check if any rows were affected to confirm the update
            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' start time updated to '{start_time}' successfully."
                )
            else:
                # Print a message if no matching job was found
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details
            print(f"Error updating job start time: {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

    def update_job_status(self, job_name, scheduled_start_time, new_status):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Define the values to be updated: new status and the current timestamp for updated_at
            update_values = {"status": new_status, "updated_at": datetime.now()}

            # Prepare the SQL update statement with conditions for job name and scheduled start time
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time,
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            
            # Commit the transaction to apply the update
            session.commit()

            # Check if any rows were affected to confirm the update
            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' status updated to '{new_status}' successfully."
                )
            else:
                # Print a message if no matching job was found
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            
            # Print an error message with details
            print(f"Error updating job status: {e}")
            
        finally:
            # Close the database session to free resources
            session.close()

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
                created_at=datetime.now(), # Set the current time as the creation time
                updated_at=datetime.now(), # Set the current time as the last update time
            )
            
            # Execute the insert statement
            session.execute(insert_stmt)
            
            # Commit the transaction to save changes to the database
            session.commit()
            
            # Print a success message
            print(f"The {job_type} for {service} scheduled successfully.")
            
        except Exception as e:
            # Rollback the transaction if an error occurs
            session.rollback()
            # Print an error message with details
            print(f"Error inserting job '{job_type} for {service}': {e}")
            
        finally:
            # Close the session to release database resources
            session.close()
            
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
            print(f"The {job_type} {service} Job exists with a frequency of '{frequency}' starting {scheduled_start_date} exists." if job else "Job not found.")
            
            # Convert the row to a dictionary, or return None if no job found
            return job._asdict() if job else None
        
        except Exception as e:
            # Print error details and return None if an exception occurs
            print(f"Error selecting job: {e}")
            return None
        
        finally:
            # Close the database session to free resources
            session.close()

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
                print(f"The {job_type} {service} Job exists with a frequency of '{frequency}' starting {scheduled_start_date} exists.")
            else:
                print(f"No {job_type} {service} Job found with a frequency of '{frequency}' starting {scheduled_start_date} exists. Nothing deleted.")
        
        # Handle any exceptions that occur, roll back the transaction, and print the error
        except Exception as e:
            session.rollback()
            print(f"Error deleting job: {e}")
        finally:
            # Close the database session to free resources
            session.close()
            
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
            
            #print(jobs_list[6])

            # Print the count of job schedules retrieved or a message if no jobs were found
            print(
                f"Retrieved {len(jobs_list)} job schedules." if jobs_list else "No job schedules found."
            )
            
            # Return the list of job schedules as a list of dictionaries
            return jobs_list
        except Exception as e:
            # Print error details if an exception occurs and return an empty list
            print(f"Error selecting all job schedules: {e}")
            return []
        finally:
            # Close the database session to free resources
            session.close()