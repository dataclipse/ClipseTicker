import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, select, insert, update, PrimaryKeyConstraint
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime

class DBManager:
    def __init__(self):
        # Create a folder for the Database if it does not exist
        if not os.path.exists('db'):
            os.makedirs('db')

        # Connect to or Create DB
        self.db_file_path = os.path.join('db', 'nyse_data.db')
        self.engine = create_engine(f'sqlite:///{self.db_file_path}')
        self.metadata = MetaData()

        print("Database created and connected successfully at:", self.db_file_path)

        # Define the stocks table
        self.stocks = Table(
            'stocks', self.metadata,
            Column('ticker_symbol', String),
            Column('close_price', Float),
            Column('highest_price', Float),
            Column('lowest_price', Float),
            Column('open_price', Float),
            Column('timestamp_end', Integer),
            Column('insert_timestamp', DateTime),
            PrimaryKeyConstraint('ticker_symbol', 'timestamp_end')
        )

        # Define the api_keys table
        self.api_keys = Table(
            'api_keys', self.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('service', String),
            Column('api_key', String)
        )

        # Create the table if it does not exist
        self.metadata.create_all(self.engine)
        print("Table created successfully.")

        # Create a session
        self.Session = sessionmaker(bind=self.engine)
    
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

    def insert_api_key(self, service, api_key):
        session = self.Session() # Create a new Session
        try:
            # First, check if the API key for a given service already exists
            select_stmt = select(self.api_keys.c.api_key).where(self.api_keys.c.service == service)
            result = session.execute(select_stmt)
            existing_key = result.scalar()

            if existing_key:
                # If the API key exists, update it
                update_stmt = update(self.api_keys).where(self.api_keys.c.service == service).values(api_key=api_key)
                session.execute(update_stmt)
                print(f"API Key for service '{service}' updated successfully.")
            else:
                # If the API key does not exist, insert it
                insert_stmt = self.api_keys.insert().values(
                    service=service,
                    api_key=api_key
                )
                session.execute(insert_stmt)
                print(f"API Key for service '{service}' inserted successfully.")

            session.commit()
        except Exception as e:
            print(f"Error inserting api key: {e}")
            session.rollback()
        finally:
            session.close()

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

    def select_api_key(self, service):
        session = self.Session()
        try:
            select_stmt = select(self.api_keys.c.api_key).where(self.api_keys.c.service == service)
            result = session.execute(select_stmt)
            api_key = result.scalar()

            if api_key:
                print(f"API Key retrieved for service '{service}': {api_key}")
                return api_key
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
            select_stmt = select(self.api_keys.c.service, self.api_keys.c.api_key)
            result = session.execute(select_stmt)
            rows = result.fetchall()

            # Create a list of service and api keys
            api_keys_list = [{"service": row.service, "api_key": row.api_key} for row in rows]

            if not api_keys_list:
                print("No API keys found.")
            else:
                print(f"Retrieved {len(api_keys_list)} API keys.")

            return api_keys_list
        
        except Exception as e:
            print(f"Error retrieving all API keys: {e}")
            return []
        
        finally:
            session.close()

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
