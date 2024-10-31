import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, select, update, PrimaryKeyConstraint, func, Index
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime
from cryptography.fernet import Fernet 
from db_schema_manager import DBSchemaManager
from job_manager import JobManager

class DBManager:
    def __init__(self):
        # Use DBSchemaManager for database and table setup
        self.schema_manager = DBSchemaManager()
        self.db_file_path = self.schema_manager.db_file_path
        self.engine = create_engine(f'sqlite:///{self.db_file_path}') 

        # Load or generate encryption key
        self.cipher, self.encryption_key = self._initialize_encryption()

        # Define the stocks and api_keys tables
        self.stocks, self.api_keys, self.jobs = self.schema_manager.define_tables()

        # Create the tables if they do no exist
        self.schema_manager.metadata.create_all(self.engine)
        print("Tables created successfully, if they didn't exist.")

        # Create a session
        self.Session = sessionmaker(bind=self.engine)
        self.job_manager = JobManager(self.Session, self.jobs)
   
    def _initialize_encryption(self):
        key_file_path = 'encrypt_key.txt'
        if os.path.exists(key_file_path):
            with open(key_file_path, 'rb') as file:
                encryption_key = file.read()
        else:
            encryption_key = Fernet.generate_key()
            with open(key_file_path, 'wb') as file:
                file.write(encryption_key)

        cipher = Fernet(encryption_key)
        return cipher, encryption_key
          
   
    def select_all_jobs(self):
        session = self.Session()
        try:
            # Prepare the select statement for all rows in the jobs table
            select_stmt = select(self.jobs)

            # Execute the select statement
            result = session.execute(select_stmt)
            jobs = result.fetchall()

            # Define your column names as a list to ensure the right keys are used
            column_names = [column.name for column in self.jobs.columns]

            # Convert the rows to a list of dictionaries for easier processing
            jobs_list = [dict(zip(column_names, row)) for row in jobs]

            if jobs_list:
                print(f"Retrieved {len(jobs_list)} jobs.")
            else:
                print("No jobs found in the jobs table.")

            return jobs_list
        
        except Exception as e:
            print(f"Error selecting all jobs: {e}")
            return []
    
        finally:
            session.close()
    
    def select_job(self, job_name, scheduled_start_time):
        session = self.Session()
        try:
            # Prepare the select statement
            select_stmt = select(self.jobs).where(
                self.jobs.c.job_name == job_name,
                self.jobs.c.scheduled_start_time == scheduled_start_time
            )

            # Execute the select statement
            result = session.execute(select_stmt)
            job = result.fetchone()

            # Return job information if found, otherwise None
            if job:
                print(f"Job '{job_name}' scheduled for {scheduled_start_time} exists.")
                return dict(job)
            else:
                print(f"No job found with name '{job_name}' scheduled for {scheduled_start_time}.")
                return None
        
        except Exception as e:
            print(f"Error selecting job: {e}")
            return None
        
        finally:
            session.close()
    
    def update_job_run_time(self, job_name, scheduled_start_time, run_time):
        session = self.Session()

        try:
            # Prepared the values to update
            update_values = {
                'run_time': run_time,
                'updated_at': datetime.now()
            }

            # Prepare the update statement
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            session.commit()

            if result.rowcount > 0:
                print(f"Job '{job_name}' run time updated to '{run_time}' successfully.")
            else:
                print(f"No job found with name '{job_name}' scheduled for {scheduled_start_time}.")
        
        except Exception as e:
            session.rollback()
            print(f"Error updating job run time: {e}")
        
        finally:
            session.close()
    
    def update_job_end_time(self, job_name, scheduled_start_time, end_time):
        session = self.Session()

        try:
            # Prepare the values to update
            update_values = {
                'end_time': end_time,
                'updated_at': datetime.now()
            }

            # Prepare the update statement
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            session.commit()

            if result.rowcount > 0:
                print(f"Job '{job_name}' end time updated to '{end_time}' successfully.")
            else:
                print(f"No job found with name '{job_name}' scheduled for {scheduled_start_time}.")

        except Exception as e:
            session.rollback()
            print(f"Error updating job end time: {e}")

        finally:
            session.close()
    
    def update_job_start_time(self, job_name, scheduled_start_time, start_time):
        session = self.Session()

        try:
            # Prepare the values to update
            update_values = {
                'start_time': start_time,
                'updated_at': datetime.now()
            }

            # Prepare the update statement
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            session.commit()

            if result.rowcount > 0:
                print(f"Job '{job_name}' start time updated to '{start_time}' successfully.")
            else:
                print(f"No job found with name '{job_name}' scheduled for {scheduled_start_time}.")
        except Exception as e:
            session.rollback()
            print(f"Error updating job start time: {e}")

        finally:
            session.close()

    def update_job_status(self, job_name, scheduled_start_time, new_status):
        session = self.Session()
        
        try:
            # Prepare the values to update
            update_values = {
                'status': new_status,
                'updated_at': datetime.now()
            }

            # Prepare the update statement
            update_stmt = (
                update(self.jobs)
                .where(
                    self.jobs.c.job_name == job_name,
                    self.jobs.c.scheduled_start_time == scheduled_start_time
                )
                .values(**update_values)
            )

            # Execute the update statement
            result = session.execute(update_stmt)
            session.commit()

            if result.rowcount > 0:
                print(f"Job '{job_name}' status updated to '{new_status}' successfully.")
            else:
                print(f"No job found with name '{job_name}' scheduled fo {scheduled_start_time}.")
        
        except Exception as e:
            session.rollback()
            print(f"Error updating job status: {e}")
        
        finally:
            session.close()

    def delete_job(self, job_name, scheduled_start_time):
        # Delete a job for a given job name and scheduled start time
        session = self.Session()

        try:
            # Convert scheduled_start_time to datetime if it is not already
            print(scheduled_start_time)
            if isinstance(scheduled_start_time, str):
                scheduled_start_time = datetime.strptime(scheduled_start_time, '%a, %d %b %Y %H:%M:%S %Z')
                print(scheduled_start_time)

            # Prepare the delete statement
            delete_stmt = self.jobs.delete().where(
                self.jobs.c.job_name == job_name,
                self.jobs.c.scheduled_start_time == scheduled_start_time
            )
            result = session.execute(delete_stmt)

            # Commit the delete
            session.commit()

            if result.rowcount > 0:
                print(f"Job '{job_name}' scheduled for {scheduled_start_time} deleted successfully.")
            else:
                print(f"No job found with the name '{job_name}' scheduled for {scheduled_start_time}.")

        except Exception as e:
            # Rollback the transaction if any error occurs
            session.rollback()
            print(f"Error deleting job '{job_name}': {e}")
        
        finally:
            # Close the session
            session.close()

    def insert_job(self, job_name, scheduled_start_time, status, start_time=None, end_time = None, run_time = None):
        session = self.Session()

        try:
            # Insert a new job row into the jobs table
            insert_stmt = self.jobs.insert().values(
                job_name=job_name,
                scheduled_start_time=scheduled_start_time,
                status=status,
                start_time=start_time,
                end_time=end_time,
                run_time=run_time,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )

            # Execute the insert statement
            session.execute(insert_stmt)

            # Commit the transaction
            session.commit()

            print(f"Job '{job_name}' scheduled for {scheduled_start_time} inserted successfully.")
        
        except Exception as e:
            # Rollback in case of any error
            session.rollback()
            print(f"Error inserting job '{job_name}': {e}")

        finally:
            # Close the session
            session.close()

    def encrypt_api_key(self, api_key):
        return self.cipher.encrypt(api_key.encode()).decode()
    
    def decrypt_api_key(self, encrypted_api_key):
        return self.cipher.decrypt(encrypted_api_key.encode()).decode()

    def delete_api_key(self, service):
        # Delete API for a given service
        session = self.Session()

        try:
            # Attempt to delete the API key base on the service name
            delete_stmt = self.api_keys.delete().where(self.api_keys.c.service == service)
            result = session.execute(delete_stmt)

            # Commit the transaction if the deletion is successful
            session.commit()

            if result.rowcount > 0:
                print(f"API key for service '{service}' deleted successfully.")
            else:
                print(f"No API key found for service '{service}'.")

        except Exception as e:
            # Rollback the transaction if any error occurs
            session.rollback()
            print(f"Error deleting API key for service '{service}': {e}")

        finally:
            # Close the session
            session.close()

    def insert_api_key(self, service, api_key):
        # Insert or update an API key with encryption.
        session = self.Session() # Create a new Session
        encrypted_key = self.encrypt_api_key(api_key)

        try:
            # First, check if the API key for a given service already exists
            select_stmt = select(self.api_keys.c.encrypted_api_key).where(self.api_keys.c.service == service)
            result = session.execute(select_stmt)
            existing_key = result.scalar()

            if existing_key:
                # If the API key exists, update it
                update_stmt = update(self.api_keys).where(self.api_keys.c.service == service).values(
                    encrypted_api_key = encrypted_key,
                    updated_at = func.now()
                )
                session.execute(update_stmt)
                print(f"API Key for service '{service}' updated successfully.")
            else:
                # If the API key does not exist, insert it
                insert_stmt = self.api_keys.insert().values(
                    service = service,
                    encrypted_api_key = encrypted_key
                )
                session.execute(insert_stmt)
                print(f"API Key for service '{service}' inserted successfully.")

            session.commit()
        except Exception as e:
            print(f"Error inserting api key: {e}")
            session.rollback()
        finally:
            session.close()

    def select_api_key(self, service):
        # Retrieve and decrypt the API key for a given service.
        session = self.Session()
        try:
            select_stmt = select(self.api_keys.c.encrypted_api_key).where(self.api_keys.c.service == service)
            result = session.execute(select_stmt)
            encrypted_api_key = result.scalar()

            if encrypted_api_key:
                decrypted_key = self.decrypt_api_key(encrypted_api_key)
                print(f"API Key retrieved for service '{service}': {decrypted_key}")
                return decrypted_key
            else:
                print(f"No API Key found for service '{service}'.")
                return None
        except Exception as e:
            print(f"Error retrieving API Key: {e}")
            return None
        finally:
            session.close()

    def select_all_api_keys(self):
        session = self.Session()
        try:
            # Query to select all api keys
            select_stmt = select(self.api_keys.c.service, self.api_keys.c.encrypted_api_key, self.api_keys.c.created_at, self.api_keys.c.updated_at)
            result = session.execute(select_stmt)
            rows = result.fetchall()

            # Create a list of service and api keys
            api_keys_list = []
            for row in rows:
                service = row.service
                encrypted_api_key = row.encrypted_api_key
                decrypted_api_key = self.decrypt_api_key(encrypted_api_key)
                created_at = row.created_at
                updated_at = row.updated_at
                api_keys_list.append({"service": service, "api_key": decrypted_api_key, "created_at": created_at, "updated_at": updated_at})
            
            if not api_keys_list:
                print("No API key found.")
            else:
                print(f"Retrieved {len(api_keys_list)} API keys.")

            return api_keys_list
        
        except Exception as e:
            print(f"Error retrieving all API keys: {e}")
            return []
        
        finally:
            session.close()

    def insert_stock(self, ticker, close_price, highest_price, lowest_price, open_price, timestamp_end, timestamp):
        # Insert a new stock row
        session = self.Session() # Create a new Session
        try:
            # First, check if the stock for the given ticker and timestamp_end already exists
            select_stmt = select(self.stocks).where(
                self.stocks.c.ticker_symbol == ticker,
                self.stocks.c.timestamp_end == timestamp_end
            )
            result = session.execute(select_stmt)
            existing_stock = result.fetchone()

            if existing_stock:
                # If the stock exists, update the record
                update_stmt = update(self.stocks).where(
                    self.stocks.c.ticker_symbol == ticker,
                    self.stocks.c.timestamp_end == timestamp_end
                ).values(
                    close_price=close_price,
                    highest_price=highest_price,
                    lowest_price=lowest_price,
                    open_price=open_price,
                    insert_timestamp=timestamp
                )
                session.execute(update_stmt)
                print(f"Stock data for {ticker} at {timestamp_end} updated successfully.")
            else:
                # If the stock does not exist, insert a new row
                insert_stmt = self.stocks.insert().values(
                    ticker_symbol=ticker, 
                    close_price=close_price, 
                    highest_price=highest_price, 
                    lowest_price=lowest_price, 
                    open_price=open_price,
                    timestamp_end=timestamp_end,
                    insert_timestamp=timestamp
                )
                session.execute(insert_stmt)
                print(f"Stock data for {ticker} at {timestamp_end} inserted successfully.")

            session.commit()
        except Exception as e:
            print(f"Error inserting stock data: {e}")
            session.rollback() # Rollback in case of error
        finally:
            session.close() # Close the session

    def select_stocks(self):
        # Select all rows
        session = self.Session()
        try:
            select_stmt = select(self.stocks)
            result = session.execute(select_stmt)
            rows = result.fetchall()

            # Display Results
            if rows:
                print("Retrieved stock data:")
                for row in rows:
                    id, ticker, price, timestamp = row # Unpack Tuple
                    print(f"ID: {id}, Ticker: {ticker}, Price: {price}, Timestamp: {timestamp}")
            else:
                print("No stock data found.")
        finally:
            session.close() # Close the session

    def insert_stock_batch(self, stock_data_batch):
        # Inserts multiple stock records into the database in a batch operation.
        session = self.Session()

        try:
            for stock in stock_data_batch:
                ticker_symbol = stock['T']
                close_price = stock['c']
                highest_price = stock['h']
                lowest_price = stock['l']
                open_price = stock['o']
                timestamp_end = stock['t']
                insert_timestamp = datetime.now()

                # Create an upsert (insert or replace) statement
                insert_stmt = sqlite_insert(self.stocks).values(
                    ticker_symbol=ticker_symbol,
                    close_price=close_price,
                    highest_price=highest_price,
                    lowest_price=lowest_price,
                    open_price=open_price,
                    timestamp_end=timestamp_end,
                    insert_timestamp=insert_timestamp
                ).prefix_with('OR REPLACE')
                
                session.execute(insert_stmt)

            session.commit()
            print(f"Inserted or updated batch of {len(stock_data_batch)} stock entries successfully.")
        
        except Exception as e:
            # Handle other possible exceptions.
            session.rollback()
            print(f"Error during batch upsert: {e}.")
        
        finally:
            session.close()

    def get_recent_stock_prices(self):
        session = self.Session()
        try:
            # Subquery to get the latest Timestamp for each ticker_symbol
            subquery = (
                select(
                    self.stocks.c.ticker_symbol,
                    func.max(self.stocks.c.timestamp_end).label('max_timestamp')
                )
                .group_by(self.stocks.c.ticker_symbol)
                .subquery()
            ) 

            # Main query to get stock detailse where timestamp_end is the latest for each ticker_symbol   
            query = (
                select(
                    self.stocks.c.ticker_symbol,
                    self.stocks.c.open_price,
                    self.stocks.c.close_price,
                    self.stocks.c.highest_price,
                    self.stocks.c.lowest_price,
                    self.stocks.c.timestamp_end,
                    subquery.c.max_timestamp
                )
                .join(subquery,
                      (self.stocks.c.ticker_symbol == subquery.c.ticker_symbol) &
                      (self.stocks.c.timestamp_end == subquery.c.max_timestamp))
            )

            # Execute the query
            result = session.execute(query)

            # Convert the result to a list of dictionaries
            stocks_data = [
                {
                    'ticker_symbol': row.ticker_symbol,
                    'open_price': row.open_price,
                    'close_price': row.close_price,
                    'highest_price': row.highest_price,
                    'lowest_price': row.lowest_price,
                    'timestamp_end': row.max_timestamp
                }
                for row in result
            ]
            
            return stocks_data
        except Exception as e:
            print(f"Error retrieving recent stock prices: {e}")
            return []
        finally:
            session.close()

    def get_stock_data_by_ticker(self, ticker_symbol):
        session = self.Session()
        try:
            # Main query to get all stock details for the given ticker symbol
            query = (
                select(
                    self.stocks.c.ticker_symbol,
                    self.stocks.c.open_price,
                    self.stocks.c.close_price,
                    self.stocks.c.highest_price,
                    self.stocks.c.lowest_price,
                    self.stocks.c.timestamp_end
                )
                .where(self.stocks.c.ticker_symbol == ticker_symbol)
            )

            # Execute the query
            result = session.execute(query)

            # Convert the result to a list of dictionaries
            stocks_data = [
                {
                    'ticker_symbol': row.ticker_symbol,
                    'open_price': row.open_price,
                    'close_price': row.close_price,
                    'highest_price': row.highest_price,
                    'lowest_price': row.lowest_price,
                    'timestamp_end': row.timestamp_end
                }
                for row in result
            ]

            return stocks_data
        except Exception as e:
            print(f"Error retrieving stock data for ticker '{ticker_symbol}': {e}")
            return []
        finally:
            session.close()

if __name__ == '__main__':
    print("Placeholder")