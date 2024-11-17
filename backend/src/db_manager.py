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
        self.db_file_path = self.schema_manager.db_file_path
        self.scrape_db_file_path = self.schema_manager.scrape_db_file_path
        
        # Create engines for both databases
        self.engine = create_engine(f"sqlite:///{self.db_file_path}")
        self.scrape_engine = create_engine(f"sqlite:///{self.scrape_db_file_path}")

        # Load or generate encryption key
        self.cipher, self.encryption_key = self._initialize_encryption()

        # Define the stocks and api_keys tables
        self.stocks, self.api_keys, self.jobs, self.users, self.stocks_scrape, self.jobs_schedule = self.schema_manager.define_tables()

        # Create the tables if they do no exist
        self.schema_manager.metadata.create_all(bind=self.engine)
        self.schema_manager.scrape_metadata.create_all(bind=self.scrape_engine)
        logger.debug("Tables created successfully, if they didn't exist.")

        # Create sessions
        self.session = sessionmaker(bind=self.engine)
        self.scrape_session = sessionmaker(bind=self.scrape_engine)
        
        # Initialize managers 
        self.job_manager = JobManager(self.session, self.jobs, self.jobs_schedule)
        self.api_key_manager = ApiKeyManager(self.session, self.api_keys, self.cipher)
        self.stock_manager = StockManager(self.session, self.stocks, self.stocks_scrape)
        self.user_manager = UserManager(self.session, self.users)
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
                encryption_key = file.read() # Read the existing encryption key
        else:
            # If the key file does not exist, generate a new encryption key
            encryption_key = Fernet.generate_key() # Generate a new encryption key
            
            # Save the new encryption key to the file for future use
            with open(key_file_path, "wb") as file:
                file.write(encryption_key) # Write the new encryption key to the file
        
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
