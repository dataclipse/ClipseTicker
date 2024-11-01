from sqlalchemy import select, update
from datetime import datetime


class JobManager:
    def __init__(self, session, jobs_table):
        self.Session = session
        self.jobs = jobs_table

    def select_all_jobs(self):
        session = self.Session()
        try:
            select_stmt = select(self.jobs)
            result = session.execute(select_stmt)
            jobs = result.fetchall()
            column_names = [column.name for column in self.jobs.columns]
            jobs_list = [dict(zip(column_names, row)) for row in jobs]

            print(
                f"Retrieved {len(jobs_list)} jobs." if jobs_list else "No jobs found."
            )
            return jobs_list
        except Exception as e:
            print(f"Error selecting all jobs: {e}")
            return []
        finally:
            session.close()

    def select_job(self, job_name, scheduled_start_time):
        session = self.Session()
        try:
            select_stmt = select(self.jobs).where(
                self.jobs.c.job_name == job_name,
                self.jobs.c.scheduled_start_time == scheduled_start_time,
            )
            result = session.execute(select_stmt)
            job = result.fetchone()
            print(f"Job {job_name} exists." if job else "Job not found.")
            return dict(job) if job else None
        except Exception as e:
            print(f"Error selecting job: {e}")
            return None
        finally:
            session.close()

    def update_job(self, job_name, scheduled_start_time, **update_values):
        session = self.Session()
        try:
            update_values["updated_at"] = datetime.now()
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time,
                )
                .values(**update_values)
            )
            result = session.execute(update_stmt)
            session.commit()
            print(f"Job {job_name} updated." if result.rowcount else "Job not found.")
        except Exception as e:
            session.rollback()
            print(f"Error updating job: {e}")
        finally:
            session.close()

    def delete_job(self, job_name, scheduled_start_time):
        session = self.Session()
        try:
            # Convert scheduled_start_time to datetime if it is not already
            if isinstance(scheduled_start_time, str):
                scheduled_start_time = datetime.strptime(
                    scheduled_start_time, "%a, %d %b %Y %H:%M:%S %Z"
                )

            # Prepare the delete statement
            delete_stmt = self.jobs.delete().where(
                self.jobs.c.job_name == job_name,
                self.jobs.c.scheduled_start_time == scheduled_start_time,
            )

            result = session.execute(delete_stmt)

            # Commit the Delete
            session.commit()

            if result.rowcount > 0:
                print(f"Job {job_name} deleted successfully.")
            else:
                print(
                    f"No job found with name '{job_name}' and scheduled start time {scheduled_start_time}. Nothing deleted."
                )

        except Exception as e:
            session.rollback()
            print(f"Error deleting job: {e}")
        finally:
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
        session = self.Session()
        try:
            insert_stmt = self.jobs.insert().values(
                job_name=job_name,
                scheduled_start_time=scheduled_start_time,
                status=status,
                start_time=start_time,
                end_time=end_time,
                run_time=run_time,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            session.execute(insert_stmt)
            session.commit()
            print(f"Job {job_name} inserted successfully.")
        except Exception as e:
            session.rollback()
            print(f"Error inserting job '{job_name}': {e}")
        finally:
            session.close()

    def update_job_run_time(self, job_name, scheduled_start_time, run_time):
        session = self.Session()
        try:
            # Prepare the values to update
            update_values = {"run_time": run_time, "updated_at": datetime.now()}

            # Prepare the update statement
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
            session.commit()

            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' run time updated to '{run_time}' successfully."
                )
            else:
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            session.rollback()
            print(f"Error updating job run time: {e}")
        finally:
            session.close()

    def update_job_end_time(self, job_name, scheduled_start_time, end_time):
        session = self.Session()
        try:
            # Prepare the values to update
            update_values = {"end_time": end_time, "updated_at": datetime.now()}

            # Prepare the update statement
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
            session.commit()

            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' end time updated to '{end_time}' successfully."
                )
            else:
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            session.rollback()
            print(f"Error updating job end time: {e}")
        finally:
            session.close()

    def update_job_start_time(self, job_name, scheduled_start_time, start_time):
        session = self.Session()
        try:
            # Prepare the values to update
            update_values = {"start_time": start_time, "updated_at": datetime.now()}

            # Prepare the update statement
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
            session.commit()

            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' start time updated to '{start_time}' successfully."
                )
            else:
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            session.rollback()
            print(f"Error updating job start time: {e}")
        finally:
            session.close()

    def update_job_status(self, job_name, scheduled_start_time, new_status):
        session = self.Session()
        try:
            # Prepare the values to update
            update_values = {"status": new_status, "updated_at": datetime.now()}

            # Prepare the update statement
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
            session.commit()

            if result.rowcount > 0:
                print(
                    f"Job '{job_name}' status updated to '{new_status}' successfully."
                )
            else:
                print(
                    f"No job found with name '{job_name}' scheduled for {scheduled_start_time}."
                )
        except Exception as e:
            session.rollback()
            print(f"Error updating job status: {e}")
        finally:
            session.close()
