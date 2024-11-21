# db_management/db_schema_manager.py
import os
from datetime import datetime, timezone
from sqlalchemy import (
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    PrimaryKeyConstraint,
    Index,
    func,
)
import logging 
logger = logging.getLogger(__name__)

class DBSchemaManager:
    def __init__(self):
        # Initialize metadata for schema management
        self.scrape_metadata = MetaData()
        self.users_metadata = MetaData()
        self.api_keys_metadata = MetaData()
        self.polygon_stocks_metadata = MetaData()
        self.jobs_schedule_metadata = MetaData()
        
        # Initialize the database file path, creating it if necessary
        self.scrape_db_file_path, self.users_db_file_path, self.api_keys_db_file_path, self.polygon_stocks_db_file_path, self.jobs_schedule_db_file_path = self._initialize_database()

    def _initialize_database(self):
        # Create a folder for the database if it does not exist
        if not os.path.exists("db"):
            os.makedirs("db")

        # Set the path for the SQLite database file
        scrape_db_file_path = os.path.join("db", "nyse_scrape_data.db")
        users_db_file_path = os.path.join("db", "ct_users.db")
        api_keys_db_file_path = os.path.join("db", "ct_api_keys.db")
        polygon_stocks_db_file_path = os.path.join("db", "nyse_polygon_stocks_agg.db")
        jobs_schedule_db_file_path = os.path.join("db", "ct_jobs_schedule.db")
        
        logger.debug("Scrape database path: %s", scrape_db_file_path)
        logger.debug("Users database path: %s", users_db_file_path)
        logger.debug("API Keys database path: %s", api_keys_db_file_path)
        logger.debug("Polygon Stocks Aggregated Average database path: %s", polygon_stocks_db_file_path)
        logger.debug("Jobs Schedule database path: %s", jobs_schedule_db_file_path)
        
        return scrape_db_file_path, users_db_file_path, api_keys_db_file_path, polygon_stocks_db_file_path, jobs_schedule_db_file_path

    def define_tables(self):
        # Define the stocks table with columns for stock data
        stocks = Table(
            "stocks",
            self.polygon_stocks_metadata,
            Column("ticker_symbol", String),
            Column("close_price", Float),
            Column("highest_price", Float),
            Column("lowest_price", Float),
            Column("open_price", Float),
            Column("timestamp_end", Integer),
            Column("insert_timestamp", DateTime),
            PrimaryKeyConstraint("ticker_symbol", "timestamp_end"),
        )

        # Create an index on stocks for fast lookup by timestamp_end and ticker_symbol
        Index(
            "idx_stocks_timestamp_ticker",
            stocks.c.ticker_symbol,
            stocks.c.timestamp_end,
        )

        # Define the api_keys table for storing encrypted API keys
        api_keys = Table(
            "api_keys",
            self.api_keys_metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("service", String, unique=True, nullable=False),
            Column("encrypted_api_key", String, nullable=False),
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)),
        )
        
        # Define the users table for managing user accounts and preferences
        users = Table(
            "users",
            self.users_metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("username", String, unique=True, nullable=False),
            Column("password_hash", String, nullable=False),
            Column("role", String, nullable=False), # Possible roles: admin, user and guest
            Column("email", String),
            Column("theme_preference", String, default="Dark"), # Possible themes: Light, Dark
            Column("currency_preference", String, default="USD"), # Possible currencies: USD, EUR, GBP, etc
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)),
        )
        
        # Define the stocks_scrape table for storing scraped stock data
        stocks_scrape = Table(
            "stocks_scrape",
            self.scrape_metadata,
            Column("ticker_symbol", String, nullable=False),
            Column("company_name", String),
            Column("price", Float),
            Column("change", Float),
            Column("industry", String),
            Column("volume", Float),
            Column("pe_ratio", Float),
            Column("timestamp", DateTime, nullable=False),  # New timestamp column
            PrimaryKeyConstraint("ticker_symbol", "timestamp"),  # Composite primary key
        )
        
        # Create an index on stocks for fast lookup by timestamp_end and ticker_symbol
        Index(
            "idx_stocks_scrape_timestamp_ticker",
            stocks_scrape.c.ticker_symbol,
            stocks_scrape.c.timestamp,
        )
        
        # Define the jobs_schedule table for managing scheduled jobs
        jobs_schedule = Table(
            "jobs_schedule",
            self.jobs_schedule_metadata,
            Column("job_type", String, nullable=False),
            Column("service", String, nullable=False),
            Column("status", String, nullable=False),
            Column("owner", String, nullable=False),
            Column("frequency", String, nullable=False),
            Column("scheduled_start_date", DateTime, nullable=False),
            Column("scheduled_end_date", DateTime), 
            Column("data_fetch_start_date", DateTime),
            Column("data_fetch_end_date", DateTime),
            Column("interval_days", Integer),
            Column("weekdays", String),
            Column("run_time", String), 
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)),
            PrimaryKeyConstraint("job_type","service","frequency","scheduled_start_date"),
        )

        # Return all defined tables for easy access
        return stocks, api_keys, users, stocks_scrape, jobs_schedule
