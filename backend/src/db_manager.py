# db_manager.py
import os
from sqlalchemy import ( create_engine )
from sqlalchemy.orm import sessionmaker
from cryptography.fernet import Fernet
from .db_management.db_schema_manager import DBSchemaManager
from .db_management.job_manager import JobManager
from .db_management.api_key_manager import ApiKeyManager
from .db_management.stock_manager import StockManager
from .db_management.user_manager import UserManager
from .db_management.scrape_manager import ScrapeManager 
import logging 
logger = logging.getLogger(__name__)

class DBManager:
    def __init__(self):
        # Use DBSchemaManager for database and table setup
        self.schema_manager = DBSchemaManager()
        self.scrape_db_file_path = self.schema_manager.scrape_db_file_path
        self.users_db_file_path = self.schema_manager.users_db_file_path
        self.api_keys_db_file_path = self.schema_manager.api_keys_db_file_path
        self.polygon_stocks_db_file_path = self.schema_manager.polygon_stocks_db_file_path
        self.jobs_schedule_db_file_path = self.schema_manager.jobs_schedule_db_file_path
        self.scrape_ticker_db_file_path = self.schema_manager.scrape_ticker_db_file_path

        
        # Create engines for both databases
        self.scrape_engine = create_engine(f"sqlite:///{self.scrape_db_file_path}")
        self.users_engine = create_engine(f"sqlite:///{self.users_db_file_path}")
        self.api_keys_engine = create_engine(f"sqlite:///{self.api_keys_db_file_path}")
        self.polygon_stocks_engine = create_engine(f"sqlite:///{self.polygon_stocks_db_file_path}")
        self.jobs_schedule_engine = create_engine(f"sqlite:///{self.jobs_schedule_db_file_path}")
        self.scrape_ticker_engine = create_engine(f"sqlite:///{self.scrape_ticker_db_file_path}")

        # Load or generate encryption key
        self.cipher, self.encryption_key = self._initialize_encryption()

        # Define the stocks and api_keys tables
        self.stocks, self.api_keys, self.users, self.stocks_scrape, self.jobs_schedule, self.ticker_scrape = self.schema_manager.define_tables()

        # Create the tables if they do no exist
        self.schema_manager.scrape_metadata.create_all(bind=self.scrape_engine)
        self.schema_manager.users_metadata.create_all(bind=self.users_engine)
        self.schema_manager.api_keys_metadata.create_all(bind=self.api_keys_engine)
        self.schema_manager.polygon_stocks_metadata.create_all(bind=self.polygon_stocks_engine)
        self.schema_manager.jobs_schedule_metadata.create_all(bind=self.jobs_schedule_engine)
        self.schema_manager.scrape_ticker_metadata.create_all(bind=self.scrape_ticker_engine)
        logger.debug("Tables created successfully, if they didn't exist.")

        # Create sessions
        self.scrape_session = sessionmaker(bind=self.scrape_engine)
        self.users_session = sessionmaker(bind=self.users_engine)
        self.api_keys_session = sessionmaker(bind=self.api_keys_engine)
        self.polygon_stocks_session = sessionmaker(bind=self.polygon_stocks_engine)
        self.jobs_schedule_session = sessionmaker(bind=self.jobs_schedule_engine)
        self.scrape_ticker_session = sessionmaker(bind=self.scrape_ticker_engine)
        
        # Initialize managers 
        self.job_manager = JobManager(self.jobs_schedule_session, self.jobs_schedule)
        self.api_key_manager = ApiKeyManager(self.api_keys_session, self.api_keys, self.cipher)
        self.stock_manager = StockManager(self.polygon_stocks_session, self.scrape_session, self.stocks, self.stocks_scrape)
        self.user_manager = UserManager(self.users_session, self.users)
        self.scrape_manager = ScrapeManager(self.scrape_session, self.stocks_scrape)
        
        # Initialize default users
        self.initialize_default_users()

    def _initialize_encryption(self):
        # Initialize encryption by loading or generating an encryption key
        key_file_path = "encrypt_key.txt" # File path to store the encryption key
        
        # Check if the encryption key file already exists
        if os.path.exists(key_file_path):
            # If the key file exists, open it in binary read mode to load the key
            with open(key_file_path, "rb") as file:
                encryption_key = file.read() 
        else:
            # If the key file does not exist, generate a new encryption key
            encryption_key = Fernet.generate_key()
            
            # Save the new encryption key to the file for future use
            with open(key_file_path, "wb") as file:
                file.write(encryption_key) 
        
        # Create a cipher instance using the loaded or generated encryption key
        cipher = Fernet(encryption_key)
        
        # Return the cipher instance and encryption key
        return cipher, encryption_key

    def initialize_default_users(self):
        # Initialize default users if they do not already exist in the database
        default_users = [
            {"username": "Admin", "password": "admin", "role": "Admin"},
            {"username": "Guest", "password": "guest", "role": "Guest"},
        ]
        
        # Iterate through each user in the default_users list
        for user in default_users:
            # Check if the user already exists in the database
            if not self.user_manager.get_user_by_username(user["username"]):
                # If the user does not exist, create the user with the specified username, password, and role
                self.user_manager.create_user(
                    username=user["username"],
                    password=user["password"],
                    role=user["role"]
                )
                # Log a message indicating the default user has been created
                logger.debug(f"Default {user['role']} user '{user['username']}' created.")
            else:
                # Log a message if the user already exists in the database
                logger.debug(f"User '{user['username']}' already exists.")

if __name__ == "__main__":
    logger.debug("Placeholder")
