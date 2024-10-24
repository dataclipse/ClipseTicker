import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, select, insert, update, PrimaryKeyConstraint, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime
from cryptography.fernet import Fernet 

class DBManager:
    def __init__(self):
        # Initialize the database connection
        self.db_file_path = self._initialize_database()
        self.engine = create_engine(f'sqlite:///{self.db_file_path}')
        self.metadata = MetaData()

        # Load or generate encryption key
        self.cipher, self.encryption_key = self._initialize_encryption()

        # Define the stocks and api_keys tables
        self.stocks, self.api_keys = self._define_tables()

        # Create the tables if they do no exist
        self.metadata.create_all(self.engine)
        print("Tables created successfully, if they didn't exist.")

        # Create a session
        self.Session = sessionmaker(bind=self.engine)

    def _initialize_database(self):
        # Create a folder for the Database if it does not exist
        if not os.path.exists('db'):
            os.makedirs('db')
        
        db_file_path = os.path.join('db', 'nyse_data.db')
        print("Database created and/or connected successfully at:", db_file_path)
        return db_file_path
    
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
    
    def _define_tables(self):
        # Define the stocks table
        stocks = Table(
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
        api_keys = Table(
            'api_keys', self.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('service', String, unique=True, nullable=False),
            Column('encrypted_api_key', String, nullable=False),
            Column('created_at', DateTime, default=func.now()),
            Column('updated_at', DateTime, default=func.now(), onupdate=func.now())
        )

        return stocks, api_keys
    
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

    def select_all_api_keys(self):
        session = self.Session()
        try:
            # Query to select all api keys
            select_stmt = select(self.api_keys.c.service, self.api_keys.c.encrypted_api_key)
            result = session.execute(select_stmt)
            rows = result.fetchall()

            # Create a list of service and api keys
            api_keys_list = []
            for row in rows:
                service = row.service
                encrypted_api_key = row.encrypted_api_key
                decrypted_api_key = self.decrypt_api_key(encrypted_api_key)
                api_keys_list.append({"service": service, "api_key": decrypted_api_key})
            
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

if __name__ == '__main__':
    print("Placeholder")