# db_management/scrape_manager.py
from sqlalchemy import select, insert, update, delete, func
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
import time
import logging 
logger = logging.getLogger(__name__)

def retry_on_exception(max_retries=3, delay=1):
    # Decorator to retry a function call if it raises an exception
    def decorator(func):
        # Wrapper function that will replace the original function
        def wrapper(*args, **kwargs):
            # Attempt to call the function up to max_retries times
            for attempt in range(max_retries):
                try:
                    # Call the original function and return its result
                    return func(*args, **kwargs)
                except Exception as e:
                    # If an exception occurs and it's not the last attempt
                    if attempt < max_retries - 1:
                        # Log a warning and wait before retrying
                        logger.warning(f"Retrying {func.__name__} due to error: {e}")
                        time.sleep(delay)
                    else:
                        # Log an error if max retries are exceeded and raise the exception
                        logger.error(f"Max retries exceeded for {func.__name__}: {e}")
                        raise
        return wrapper
    return decorator

class ScrapeManager:
    def __init__(self, session, ticker_scrape_session, scrape_table, ticker_scrape_table):
        # Initialize session and table reference for managing scrapes
        self.Session = session
        self.TickerScrapeSession = ticker_scrape_session
        self.scrape = scrape_table
        self.ticker_scrape = ticker_scrape_table

    @retry_on_exception()
    def create_scrape_batch(self, stock_data_list):
        # Batch insert multiple stock data records into the scrape table
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare an insert statement for the scrape table
            # `stock_data_list` is a list of dictionaries, where each dictionary represents a record
            insert_stmt = insert(self.scrape)
            # Execute the insert statement with batch data, inserting all records at once
            session.execute(insert_stmt, stock_data_list)
            # Commit the transaction to save changes in the database
            session.commit()
            logger.debug(f"Batch insert of {len(stock_data_list)} records completed successfully.")
        except Exception as e:
            # Rollback the transaction if an error occurs to maintain data integrity
            logger.error(f"Error creating scrape batch: {e}")  
            session.rollback()
            raise
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def create_scrape(self, ticker_symbol, company_name, price, change, industry, volume=None, pe_ratio=None, timestamp=None):
        # Create a single scrape record in the scrape table with the provided data
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare an insert statement with specified values for the new scrape record
            insert_stmt = self.scrape.insert().values(
                ticker_symbol=ticker_symbol,
                company_name=company_name,
                price=price,
                change=change,
                industry=industry,
                volume=volume if volume is not None else 0.0,
                pe_ratio=pe_ratio if pe_ratio is not None else 0.0,
                timestamp=timestamp or datetime.now(timezone.utc)
            )
            # Execute the insert statement to add the new record
            session.execute(insert_stmt)
            # Commit the transaction to save the changes in the database
            session.commit()
            logger.debug(f"Scrape for {ticker_symbol} at {timestamp} created successfully.")
        except SQLAlchemyError as e:
            # Rollback the transaction in case of an error to maintain data integrity
            logger.error(f"Error creating scrape: {e}")
            session.rollback()
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def get_scrapes(self):
        # Retrieve all scrape records from the scrape table
        session = self.Session()# Open a new session for database interaction
        try:
            # Prepare a select statement to fetch all records from the scrape table
            select_stmt = select(self.scrape)
            # Execute the select statement and fetch all results
            result = session.execute(select_stmt)
            scrapes = result.fetchall() # Fetch all records
            # Get column names for the scrape table to format each record as a dictionary
            column_names = [column.name for column in self.scrape.columns]
            scrapes_list = [dict(zip(column_names, row)) for row in scrapes] # Convert each row to a dictionary
            # Log the number of records retrieved
            logger.debug(f"Retrieved {len(scrapes_list)} scrapes.")
            # Return the list of scrape records as dictionaries
            return scrapes_list
        except SQLAlchemyError as e:
            # Log error if retrieval fails and return an empty list
            logger.error(f"Error retrieving scrapes: {e}")
            return []
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def get_scrape(self, ticker_symbol, timestamp):
        # Retrieve a specific scrape record from the scrape table based on ticker symbol and timestamp
        session = self.Session()# Open a new session for database interaction
        try:
            # Prepare a select statement with conditions to match the specified ticker symbol and timestamp
            select_stmt = select(self.scrape).where(
                self.scrape.c.ticker_symbol == ticker_symbol,
                self.scrape.c.timestamp == timestamp
            )
            # Execute the select statement and fetch a single result
            result = session.execute(select_stmt).fetchone()
            # If a record is found, convert it to a dictionary with column names as keys
            if result:
                scrape = dict(zip([column.name for column in self.scrape.columns], result))
                logger.debug(f"Scrape for {ticker_symbol} at {timestamp} retrieved successfully.")
                return scrape # Return the scrape record as a dictionary
            else:
                # Log if no matching record is found
                logger.debug("Scrape not found.")
                return None
        except SQLAlchemyError as e:
            # Log any error that occurs during retrieval
            logger.error(f"Error retrieving scrape: {e}")
            return None
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def update_scrape(self, ticker_symbol, timestamp, **kwargs):
        # Update a specific scrape record in the scrape table with new values
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare an update statement with conditions to match the specified ticker symbol and timestamp
            # `kwargs` contains the new values to update
            update_stmt = update(self.scrape).where(
                self.scrape.c.ticker_symbol == ticker_symbol,
                self.scrape.c.timestamp == timestamp
            ).values(**kwargs)
            # Execute the update statement
            result = session.execute(update_stmt)
            # Commit the transaction to save the changes in the database
            session.commit()
            # Check if any rows were affected by the update
            if result.rowcount > 0:
                logger.debug(f"Scrape for {ticker_symbol} at {timestamp} updated successfully.")
                return True # Return True to indicate a successful update
            else:
                # Log if no matching record was found for update
                logger.debug("Scrape not found for update.")
                return False # Return False to indicate that no record was updated
        except SQLAlchemyError as e:
            # Rollback the transaction in case of an error to maintain data integrity
            logger.error(f"Error updating scrape: {e}")
            session.rollback()
            return False
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def delete_scrape(self, ticker_symbol, timestamp):
        # Delete a specific scrape record from the scrape table based on ticker symbol and timestamp
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a delete statement with conditions to match the specified ticker symbol and timestamp
            delete_stmt = delete(self.scrape).where(
                self.scrape.c.ticker_symbol == ticker_symbol,
                self.scrape.c.timestamp == timestamp
            )
            # Execute the delete statement
            result = session.execute(delete_stmt)
            # Commit the transaction to save the changes in the database
            session.commit()
            # Check if any rows were affected by the delete operation
            if result.rowcount > 0:
                logger.debug(f"Scrape for {ticker_symbol} at {timestamp} deleted successfully.")
                return True # Return True to indicate a successful deletion
            else:
                # Log if no matching record was found for deletion
                logger.debug("Scrape not found for deletion.")
                return False # Return False to indicate that no record was deleted
        except SQLAlchemyError as e:
            # Rollback the transaction in case of an error to maintain data integrity
            logger.error(f"Error deleting scrape: {e}")
            session.rollback()
            return False
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def replace_scrape(self, ticker_symbol, timestamp, new_timestamp, **kwargs):
        session = self.Session()
        try:
            # Select existing scrape
            select_stmt = select(self.scrape).where(
                self.scrape.c.ticker_symbol == ticker_symbol,
                self.scrape.c.timestamp == timestamp
            )
            existing_row = session.execute(select_stmt).fetchone()
            if not existing_row:
                logger.debug(f"Scrape for {ticker_symbol} at {timestamp} not found.")
                return False
            column_names = [column.name for column in self.scrape.columns]
            # Save info to dictionary
            row_data = dict(zip(column_names, existing_row))
            # Delete existing scrape
            delete_stmt = delete(self.scrape).where(
                self.scrape.c.ticker_symbol == ticker_symbol,
                self.scrape.c.timestamp == timestamp
            )
            session.execute(delete_stmt)
            row_data['timestamp'] = new_timestamp
            row_data.update(kwargs)
            # Insert new scrape with new timestamp
            insert_stmt = insert(self.scrape).values(row_data)
            session.execute(insert_stmt)
            session.commit()
            logger.info(f"Scrape for {ticker_symbol} at {timestamp} replaced with {new_timestamp}.")
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error replacing scrape: {e}")
            session.rollback()
            return False
        finally:
            session.close()

    @retry_on_exception()
    def get_stock_scrape_data_by_ticker(self, ticker_symbol):
        # Retrieve all stock scrape data for a specific ticker symbol from the stocks_scrape table
        session = self.Session()  # Open a new session for database interaction
        try:
            # Prepare a select query to fetch records for the specified ticker symbol
            query = select(
                self.scrape.c.ticker_symbol,
                self.scrape.c.company_name,
                self.scrape.c.price,
                self.scrape.c.change,
                self.scrape.c.industry,
                self.scrape.c.volume,
                self.scrape.c.pe_ratio,
                self.scrape.c.timestamp,
            ).where(self.scrape.c.ticker_symbol == ticker_symbol)
            # Execute the query to retrieve the stock scrape data for the given ticker symbol
            result = session.execute(query)
            # Convert each row of the result into a dictionary and store it in a list
            stocks_scrape_data = [
                {
                    "ticker_symbol": row.ticker_symbol,
                    "company_name": row.company_name,
                    "price": row.price,
                    "change": row.change,
                    "industry": row.industry,
                    "volume": row.volume,
                    "pe_ratio": row.pe_ratio,
                    "timestamp": row.timestamp,
                }
                for row in result
            ]
            # Return the list of dictionaries containing stock scrape data for the specified ticker
            return stocks_scrape_data
        except Exception as e:
            # Print an error message and return an empty list if an error occurs
            logger.error(f"Error retrieving stock scrape data for '{ticker_symbol}': {e}")
            return []
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def get_recent_stock_scrapes(self):
        # Retrieve the most recent stock scrape data for each ticker symbol
        session = self.Session()
        try:
            # Define a subquery to get the latest timestamp for each ticker symbol
            subquery = (
                select(
                    self.scrape.c.ticker_symbol,
                    func.max(self.scrape.c.timestamp).label("max_timestamp"),
                )
                .group_by(self.scrape.c.ticker_symbol)
                .subquery()
            )
            # Define the main query to get stock scrape data with the most recent timestamp for each ticker
            query = select(
                self.scrape.c.ticker_symbol,
                self.scrape.c.company_name,
                self.scrape.c.price,
                self.scrape.c.change,
                self.scrape.c.industry,
                self.scrape.c.volume,
                self.scrape.c.pe_ratio,
                self.scrape.c.timestamp,
                subquery.c.max_timestamp,
            ).join(
                subquery,
                (self.scrape.c.ticker_symbol == subquery.c.ticker_symbol)
                & (self.scrape.c.timestamp == subquery.c.max_timestamp),
            )
            # Execute the query to retrieve the latest stock scrape data for each ticker
            result = session.execute(query)
            # Convert each row of result into a dictionary and store it in a list
            stocks_data = [
                {
                    "ticker_symbol": row.ticker_symbol,
                    "company_name": row.company_name,
                    "price": row.price,
                    "change": row.change,
                    "industry": row.industry,
                    "volume": row.volume,
                    "pe_ratio": row.pe_ratio,
                    "timestamp": row.timestamp,
                }
                for row in result
            ]
            return stocks_data
        except Exception as e:
            logger.error(f"Error retrieving recent stock scrape data: {e}")
            return []
        finally:
            session.close()

    @retry_on_exception()
    def batch_create_or_update_scrape_ticker_stats(self, data_list):
        session = self.TickerScrapeSession()
        try:
            for data in data_list:
                ticker_symbol = data.get('ticker_symbol')
                if not ticker_symbol:
                    logger.warning("Ticker symbol is missing in the data.")
                    continue
                
                select_stmt = select(self.ticker_scrape).where(self.ticker_scrape.c.ticker_symbol == ticker_symbol)
                existing_record = session.execute(select_stmt).fetchone()
                
                if existing_record:
                    update_stmt = update(self.ticker_scrape).where(self.ticker_scrape.c.ticker_symbol == ticker_symbol).values(**data)
                    session.execute(update_stmt)
                else:
                    insert_stmt = insert(self.ticker_scrape).values(**data)
                    session.execute(insert_stmt)
            session.commit()
            logger.debug(f"Batch create or update of {len(data_list)} records completed successfully.")
        except SQLAlchemyError as e:
            logger.error(f"Error in batch create or update: {e}")
            session.rollback()
            raise
        finally:
            session.close()     

    @retry_on_exception()
    def get_scrape_ticker_stats(self, ticker_symbol):
        # Retrieve all ticker scrape records for a specific ticker symbol
        session = self.TickerScrapeSession()
        try:
            # Prepare a select statement with conditions to match the specified ticker symbol
            select_stmt = select(self.ticker_scrape).where(
                self.ticker_scrape.c.ticker_symbol == ticker_symbol
            )
            # Execute the select statement and fetch all result
            result = session.execute(select_stmt)
            ticker_scrapes = result.fetchall()
            # Get column names for the ticker scrape table to format each record as a dictionary
            column_names = [column.name for column in self.ticker_scrape.columns]
            ticker_scrapes_list = [dict(zip(column_names, row)) for row in ticker_scrapes]
            # Log the number of records retrieved
            logger.debug(f"Retrieved {len(ticker_scrapes_list)} ticker scrapes for {ticker_symbol}.")
            # Return the list of ticker scrape records as dictionaries
            return ticker_scrapes_list
        except SQLAlchemyError as e:
            # Log error if retrieval fails and return an empty list
            logger.error(f"Error retrieving ticker scrapes for {ticker_symbol}: {e}")
            return []
        finally:
            # Close the session to free resources
            session.close()

