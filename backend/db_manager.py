# db_manager.py
import os
from sqlalchemy import (
    create_engine,
    select,
    update,
    func,
    delete,
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime
from cryptography.fernet import Fernet
import bcrypt
from db_schema_manager import DBSchemaManager
from job_manager import JobManager
from api_key_manager import ApiKeyManager
from stock_manager import StockManager
from user_manager import UserManager


class DBManager:
    def __init__(self):
        # Use DBSchemaManager for database and table setup
        self.schema_manager = DBSchemaManager()
        self.db_file_path = self.schema_manager.db_file_path
        self.engine = create_engine(f"sqlite:///{self.db_file_path}")

        # Load or generate encryption key
        self.cipher, self.encryption_key = self._initialize_encryption()

        # Define the stocks and api_keys tables
        self.stocks, self.api_keys, self.jobs, self.users = self.schema_manager.define_tables()

        # Create the tables if they do no exist
        self.schema_manager.metadata.create_all(self.engine)
        print("Tables created successfully, if they didn't exist.")

        # Create a session
        self.Session = sessionmaker(bind=self.engine)
        self.job_manager = JobManager(self.Session, self.jobs)
        self.api_key_manager = ApiKeyManager(self.Session, self.api_keys, self.cipher)
        self.stock_manager = StockManager(self.Session, self.stocks)
        self.user_manager = UserManager(self.Session, self.users)

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

                

if __name__ == "__main__":
    print("Placeholder")
