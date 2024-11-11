# db_management/stock_manager.py
from sqlalchemy import select, update, func
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime
import logging 
logger = logging.getLogger(__name__)

class StockManager:
    def __init__(self, session, stocks_table):
        # Initialize the class with a session factory and a reference to the stocks table
        self.Session = session
        self.stocks = stocks_table

    def insert_stock(self, ticker, close_price, highest_price, lowest_price, open_price, timestamp_end, timestamp):
        # Insert or update stock data in the stocks table based on ticker and timestamp_end
        session = self.Session()# Open a new session for database interaction
        try:
            # Prepare a select statement to check if a record with the same ticker and timestamp_end already exists
            select_stmt = select(self.stocks).where(
                self.stocks.c.ticker_symbol == ticker,
                self.stocks.c.timestamp_end == timestamp_end,
            )
            result = session.execute(select_stmt)
            existing_stock = result.fetchone() # Fetch the existing record if it exists
            
            if existing_stock:
                # If the stock record exists, prepare an update statement with new values
                update_stmt = (
                    update(self.stocks)
                    .where(
                        self.stocks.c.ticker_symbol == ticker,
                        self.stocks.c.timestamp_end == timestamp_end,
                    )
                    .values(
                        close_price=close_price,
                        highest_price=highest_price,
                        lowest_price=lowest_price,
                        open_price=open_price,
                        insert_timestamp=timestamp, # Update insert timestamp with the latest time
                    )
                )
                # Execute the update statement to modify the existing record
                session.execute(update_stmt)
                logger.debug(f"Stock data for {ticker} at {timestamp_end} updated successfully.")
            else:
                # If no existing record is found, prepare an insert statement with the provided values
                insert_stmt = self.stocks.insert().values(
                    ticker_symbol=ticker,
                    close_price=close_price,
                    highest_price=highest_price,
                    lowest_price=lowest_price,
                    open_price=open_price,
                    timestamp_end=timestamp_end,
                    insert_timestamp=timestamp,
                )
                # Execute the insert statement to add the new record
                session.execute(insert_stmt)
                logger.debug(f"Stock data for {ticker} at {timestamp_end} inserted successfully.")
            
            # Commit the transaction to save the changes in the database
            session.commit()
        except Exception as e:
            # Rollback the transaction in case of an error to maintain data integrity
            logger.error(f"Error inserting stock data: {e}")
            session.rollback()
        finally:
            # Close the session to free resources
            session.close()
            
    def select_stock(self):
        # Retrieve all stock data records from the stocks table
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a select statement to fetch all records from the stocks table
            select_stmt = select(self.stocks)
            
            # Execute the select statement and fetch all results
            result = session.execute(select_stmt)
            rows = result.fetchall() # Fetch all records as a list of rows
            
            # Check if any records were retrieved
            if rows:
                logger.debug("Retrieved stock data:")
                # Iterate through each row and print stock details
                for row in rows:
                    id, ticker, price, timestamp = row
                    logger.debug(f"ID: {id}, Ticker: {ticker}, Price: {price}, Timestamp: {timestamp}")
            else:
                # Log if no stock data was found
                logger.debug("No stock data found.")
        except Exception as e:
            # Rollback if an error occurs and log the error
            session.rollback()
            logger.error(f"Error selecting stock data: {e}")
        finally:
            # Close the session to free resources
            session.close()
            
    def insert_stock_batch(self, stock_data_batch):
        # Insert or update a batch of stock data records in the stocks table
        session = self.Session() # Open a new session for database interaction
        try:
            for stock in stock_data_batch:
                # Extract stock data fields from each dictionary in the batch
                ticker_symbol = stock["T"]
                close_price = stock["c"]
                highest_price = stock["h"]
                lowest_price = stock["l"]
                open_price = stock["o"]
                timestamp_end = stock["t"]
                insert_timestamp = datetime.now()
                
                # Prepare an insert statement with "OR REPLACE" to upsert each stock record
                insert_stmt = (
                    sqlite_insert(self.stocks)
                    .values(
                        ticker_symbol=ticker_symbol,
                        close_price=close_price,
                        highest_price=highest_price,
                        lowest_price=lowest_price,
                        open_price=open_price,
                        timestamp_end=timestamp_end,
                        insert_timestamp=insert_timestamp,
                    )
                    .prefix_with("OR REPLACE") # Use "OR REPLACE" to update existing records with the same primary key
                )
                
                # Execute the upsert (insert or replace) for the current stock record
                session.execute(insert_stmt)
            
            # Commit the transaction to save all changes in the database
            session.commit()
            logger.debug(f"Inserted or update batch of {len(stock_data_batch)} stock entries successfully.")
            
        except Exception as e:
            # Rollback the transaction in case of an error to maintain data integrity
            session.rollback()
            logger.error(f"Error during batch upsert: {e}")
        finally:
            # Close the session to free resources
            session.close()
            
    def get_recent_stock_prices(self):
        # Retrieve the most recent stock prices for each ticker symbol in the stocks table
        session = self.Session() # Open a new session for database interaction
        try:
            # Define a subquery to get the latest timestamp for each ticker symbol
            subquery = (
                select(
                    self.stocks.c.ticker_symbol,
                    func.max(self.stocks.c.timestamp_end).label("max_timestamp"),
                )
                .group_by(self.stocks.c.ticker_symbol)
                .subquery()
            )
            
            # Define the main query to get stock data with the most recent timestamp for each ticker
            query = select(
                self.stocks.c.ticker_symbol,
                self.stocks.c.open_price,
                self.stocks.c.close_price,
                self.stocks.c.highest_price,
                self.stocks.c.lowest_price,
                self.stocks.c.timestamp_end,
                subquery.c.max_timestamp,
            ).join(
                subquery,
                (self.stocks.c.ticker_symbol == subquery.c.ticker_symbol)
                & (self.stocks.c.timestamp_end == subquery.c.max_timestamp),
            )
            
            # Execute the query to retrieve the latest stock data for each ticker
            result = session.execute(query)
            
            # Convert each row of result into a dictionary and store it in a list
            stocks_data = [
                {
                    "ticker_symbol": row.ticker_symbol,
                    "open_price": row.open_price,
                    "close_price": row.close_price,
                    "highest_price": row.highest_price,
                    "lowest_price": row.lowest_price,
                    "timestamp_end": row.max_timestamp,
                }
                for row in result
            ]
            
            # Return the list of dictionaries containing the latest stock data for each ticker
            return stocks_data
        except Exception as e:
            # Print an error message and return an empty list if an error occurs
            logger.debug(f"Error retrieving recent stock prices: {e}")
            return []
        finally:
            # Close the session to free resources
            session.close()
            
    def get_stock_data_by_ticker(self, ticker_symbol):
        # Retrieve all stock data for a specific ticker symbol from the stocks table
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a select query to fetch records for the specified ticker symbol
            query = select(
                self.stocks.c.ticker_symbol,
                self.stocks.c.open_price,
                self.stocks.c.close_price,
                self.stocks.c.highest_price,
                self.stocks.c.lowest_price,
                self.stocks.c.timestamp_end,
            ).where(self.stocks.c.ticker_symbol == ticker_symbol)
            
            # Execute the query to retrieve the stock data for the given ticker symbol
            result = session.execute(query)
            
            # Convert each row of the result into a dictionary and store it in a list
            stocks_data = [
                {
                    "ticker_symbol": row.ticker_symbol,
                    "open_price": row.open_price,
                    "close_price": row.close_price,
                    "highest_price": row.highest_price,
                    "lowest_price": row.lowest_price,
                    "timestamp_end": row.timestamp_end,
                }
                for row in result
            ]
            
            # Return the list of dictionaries containing stock data for the specified ticker
            return stocks_data
        except Exception as e:
            # Print an error message and return an empty list if an error occurs
            logger.error(f"Error retrieving stock data for '{ticker_symbol}': {e}")
            return []
        finally:
            # Close the session to free resources
            session.close()
            