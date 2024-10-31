import os
from sqlalchemy import MetaData, Table, Column, Integer, String, Float, DateTime, PrimaryKeyConstraint, Index, func

class DBSchemaManager:
    def __init__(self):
        self.metadata = MetaData()
        self.db_file_path = self._initialize_database()

    def _initialize_database(self):
        # Create a fodler for the Database if it does not exist
        if not os.path.exists('db'):
            os.makedirs('db')

        db_file_path = os.path.join('db','nyse_data.db')
        print("Database created and/or connected successfully at:", db_file_path)
        return db_file_path
    
    def define_tables(self):
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

        # Create an index on the stocks table for timestamp_end and ticker_symbol
        Index('idx_stocks_timestamp_ticker', stocks.c.ticker_symbol, stocks.c.timestamp_end)

        # Define the api_keys table
        api_keys = Table(
            'api_keys', self.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('service', String, unique=True, nullable=False),
            Column('encrypted_api_key', String, nullable=False),
            Column('created_at', DateTime, default=func.now()),
            Column('updated_at', DateTime, default=func.now(), onupdate=func.now())
        )

        # Define the jobs table
        jobs = Table(
            'jobs', self.metadata,
            Column('job_name', String, nullable=False),
            Column('scheduled_start_time', DateTime, nullable=False),
            Column('status', String, nullable=False), # e.g., "pending", "running", "completed", "scheduled"
            Column('start_time', DateTime),
            Column('end_time', DateTime),
            Column('run_time', String), # Duration in Hours Minutes and Seconds
            Column('created_at', DateTime, default=func.now()),
            Column('updated_at', DateTime, default=func.now(), onupdate=func.now()),
            PrimaryKeyConstraint('job_name', 'scheduled_start_time') # Composite primary key
        )

        return stocks, api_keys, jobs