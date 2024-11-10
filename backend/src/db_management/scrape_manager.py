from sqlalchemy import select, insert, update, delete
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import logging

class ScrapeManager:
    def __init__(self, session, scrape_table):
        # Initialize session and table reference for managing scrapes
        self.Session = session
        self.scrape = scrape_table
    
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
            print(f"Batch insert of {len(stock_data_list)} records completed successfully.")
        except Exception as e:
            # Rollback the transaction if an error occurs to maintain data integrity
            print(f"Error creating scrape batch: {e}")
            session.rollback()
        finally:
            # Close the session to free resources
            session.close()
        
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
                timestamp=timestamp or datetime.now()
            )
            
            # Execute the insert statement to add the new record
            session.execute(insert_stmt)
            
            # Commit the transaction to save the changes in the database
            session.commit()
            print(f"Scrape for {ticker_symbol} at {timestamp} created successfully.")
        except SQLAlchemyError as e:
            # Rollback the transaction in case of an error to maintain data integrity
            print(f"Error creating scrape: {e}")
            session.rollback()
        finally:
            # Close the session to free resources
            session.close()
            
    def get_scrapes(self):
        # Retrieve all scrape records from the scrape table
        session = self.Session()# Open a new session for database interaction
        try:
            # Prepare a select statement to fetch all records from the scrape table
            select_stmt = select(self.stocks_scrape)
            
            # Execute the select statement and fetch all results
            result = session.execute(select_stmt)
            scrapes = result.fetchall() # Fetch all records
            
            # Get column names for the scrape table to format each record as a dictionary
            column_names = [column.name for column in self.stocks_scrape.columns]
            scrapes_list = [dict(zip(column_names, row)) for row in scrapes] # Convert each row to a dictionary
            
            # Log the number of records retrieved
            print(f"Retrieved {len(scrapes_list)} scrapes.")
            
            # Return the list of scrape records as dictionaries
            return scrapes_list
        except SQLAlchemyError as e:
            # Log error if retrieval fails and return an empty list
            print(f"Error retrieving scrapes: {e}")
            return []
        finally:
            # Close the session to free resources
            session.close()

    def get_scrape(self, ticker_symbol, timestamp):
        # Retrieve a specific scrape record from the scrape table based on ticker symbol and timestamp
        session = self.Session()# Open a new session for database interaction
        try:
            # Prepare a select statement with conditions to match the specified ticker symbol and timestamp
            select_stmt = select(self.stocks_scrape).where(
                self.stocks_scrape.c.ticker_symbol == ticker_symbol,
                self.stocks_scrape.c.timestamp == timestamp
            )
            
            # Execute the select statement and fetch a single result
            result = session.execute(select_stmt).fetchone()
            
            # If a record is found, convert it to a dictionary with column names as keys
            if result:
                scrape = dict(zip([column.name for column in self.stocks_scrape.columns], result))
                print(f"Scrape for {ticker_symbol} at {timestamp} retrieved successfully.")
                return scrape # Return the scrape record as a dictionary
            else:
                # Log if no matching record is found
                print("Scrape not found.")
                return None
        except SQLAlchemyError as e:
            # Log any error that occurs during retrieval
            print(f"Error retrieving scrape: {e}")
            return None
        finally:
            # Close the session to free resources
            session.close()
            
    def update_scrape(self, ticker_symbol, timestamp, **kwargs):
        # Update a specific scrape record in the scrape table with new values
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare an update statement with conditions to match the specified ticker symbol and timestamp
            # `kwargs` contains the new values to update
            update_stmt = update(self.stocks_scrape).where(
                self.stocks_scrape.c.ticker_symbol == ticker_symbol,
                self.stocks_scrape.c.timestamp == timestamp
            ).values(**kwargs)
            
            # Execute the update statement
            result = session.execute(update_stmt)
            
            # Commit the transaction to save the changes in the database
            session.commit()
            
            # Check if any rows were affected by the update
            if result.rowcount > 0:
                print(f"Scrape for {ticker_symbol} at {timestamp} updated successfully.")
                return True # Return True to indicate a successful update
            else:
                # Log if no matching record was found for update
                print("Scrape not found for update.")
                return False # Return False to indicate that no record was updated
        except SQLAlchemyError as e:
            # Rollback the transaction in case of an error to maintain data integrity
            print(f"Error updating scrape: {e}")
            session.rollback()
            return False
        finally:
            # Close the session to free resources
            session.close()
            
    def delete_scrape(self, ticker_symbol, timestamp):
        # Delete a specific scrape record from the scrape table based on ticker symbol and timestamp
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a delete statement with conditions to match the specified ticker symbol and timestamp
            delete_stmt = delete(self.stocks_scrape).where(
                self.stocks_scrape.c.ticker_symbol == ticker_symbol,
                self.stocks_scrape.c.timestamp == timestamp
            )
            
            # Execute the delete statement
            result = session.execute(delete_stmt)
            # Commit the transaction to save the changes in the database
            session.commit()
            
            # Check if any rows were affected by the delete operation
            if result.rowcount > 0:
                print(f"Scrape for {ticker_symbol} at {timestamp} deleted successfully.")
                return True # Return True to indicate a successful deletion
            else:
                # Log if no matching record was found for deletion
                print("Scrape not found for deletion.")
                return False # Return False to indicate that no record was deleted
        except SQLAlchemyError as e:
            # Rollback the transaction in case of an error to maintain data integrity
            print(f"Error deleting scrape: {e}")
            session.rollback()
            return False
        finally:
            # Close the session to free resources
            session.close()