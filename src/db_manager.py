import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, select, insert
from sqlalchemy.orm import sessionmaker

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
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('ticker_symbol', String),
            Column('close_price', Float),
            Column('highest_price', Float),
            Column('lowest_price', Float),
            Column('open_price', Float),
            Column('timestamp_end', Integer),
            Column('insert_timestamp', DateTime)
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
