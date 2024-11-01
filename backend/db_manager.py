import os
from sqlalchemy import (
    create_engine,
    select,
    update,
    func,
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime
from cryptography.fernet import Fernet
from db_schema_manager import DBSchemaManager
from job_manager import JobManager
from api_key_manager import ApiKeyManager


class DBManager:
    def __init__(self):
        # Use DBSchemaManager for database and table setup
        self.schema_manager = DBSchemaManager()
        self.db_file_path = self.schema_manager.db_file_path
        self.engine = create_engine(f"sqlite:///{self.db_file_path}")

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
        self.api_key_manager = ApiKeyManager(self.Session, self.api_keys, self.cipher)

    def _initialize_encryption(self):
        key_file_path = "encrypt_key.txt"
        if os.path.exists(key_file_path):
            with open(key_file_path, "rb") as file:
                encryption_key = file.read()
        else:
            encryption_key = Fernet.generate_key()
            with open(key_file_path, "wb") as file:
                file.write(encryption_key)

        cipher = Fernet(encryption_key)
        return cipher, encryption_key

    def insert_stock(
        self,
        ticker,
        close_price,
        highest_price,
        lowest_price,
        open_price,
        timestamp_end,
        timestamp,
    ):
        # Insert a new stock row
        session = self.Session()  # Create a new Session
        try:
            # First, check if the stock for the given ticker and timestamp_end already exists
            select_stmt = select(self.stocks).where(
                self.stocks.c.ticker_symbol == ticker,
                self.stocks.c.timestamp_end == timestamp_end,
            )
            result = session.execute(select_stmt)
            existing_stock = result.fetchone()

            if existing_stock:
                # If the stock exists, update the record
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
                        insert_timestamp=timestamp,
                    )
                )
                session.execute(update_stmt)
                print(
                    f"Stock data for {ticker} at {timestamp_end} updated successfully."
                )
            else:
                # If the stock does not exist, insert a new row
                insert_stmt = self.stocks.insert().values(
                    ticker_symbol=ticker,
                    close_price=close_price,
                    highest_price=highest_price,
                    lowest_price=lowest_price,
                    open_price=open_price,
                    timestamp_end=timestamp_end,
                    insert_timestamp=timestamp,
                )
                session.execute(insert_stmt)
                print(
                    f"Stock data for {ticker} at {timestamp_end} inserted successfully."
                )

            session.commit()
        except Exception as e:
            print(f"Error inserting stock data: {e}")
            session.rollback()  # Rollback in case of error
        finally:
            session.close()  # Close the session

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
                    id, ticker, price, timestamp = row  # Unpack Tuple
                    print(
                        f"ID: {id}, Ticker: {ticker}, Price: {price}, Timestamp: {timestamp}"
                    )
            else:
                print("No stock data found.")
        finally:
            session.close()  # Close the session

    def insert_stock_batch(self, stock_data_batch):
        # Inserts multiple stock records into the database in a batch operation.
        session = self.Session()

        try:
            for stock in stock_data_batch:
                ticker_symbol = stock["T"]
                close_price = stock["c"]
                highest_price = stock["h"]
                lowest_price = stock["l"]
                open_price = stock["o"]
                timestamp_end = stock["t"]
                insert_timestamp = datetime.now()

                # Create an upsert (insert or replace) statement
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
                    .prefix_with("OR REPLACE")
                )

                session.execute(insert_stmt)

            session.commit()
            print(
                f"Inserted or updated batch of {len(stock_data_batch)} stock entries successfully."
            )

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
                    func.max(self.stocks.c.timestamp_end).label("max_timestamp"),
                )
                .group_by(self.stocks.c.ticker_symbol)
                .subquery()
            )

            # Main query to get stock detailse where timestamp_end is the latest for each ticker_symbol
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

            # Execute the query
            result = session.execute(query)

            # Convert the result to a list of dictionaries
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
            query = select(
                self.stocks.c.ticker_symbol,
                self.stocks.c.open_price,
                self.stocks.c.close_price,
                self.stocks.c.highest_price,
                self.stocks.c.lowest_price,
                self.stocks.c.timestamp_end,
            ).where(self.stocks.c.ticker_symbol == ticker_symbol)

            # Execute the query
            result = session.execute(query)

            # Convert the result to a list of dictionaries
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

            return stocks_data
        except Exception as e:
            print(f"Error retrieving stock data for ticker '{ticker_symbol}': {e}")
            return []
        finally:
            session.close()


if __name__ == "__main__":
    print("Placeholder")
