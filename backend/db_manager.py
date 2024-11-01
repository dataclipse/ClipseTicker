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

# Hash password using bcrypt
def _hash_password(self, password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# Verify password using bcrypt
def _verify_password(self, password, hashed_password):
    return bcrypt.checkpw(password.encode(), hashed_password.encode())

# Create a new user
def create_user(self, username, password, role):
    session = self.Session()
    try:
        hashed_password = self._hash_password(password)
        new_user = {
            "username": username,
            "password_hash": hashed_password,
            "role": role,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        insert_stmt = sqlite_insert(self.users).values(new_user)
        session.execute(insert_stmt)
        session.commit()
        print(f"User '{username}' created successfully.")
    except Exception as e:
        session.rollback()
        print(f"Error creating user '{username}': {e}")
    finally:
        session.close()

# Retrieve a user by username
def get_user_by_username(self, username):
    session = self.Session()
    try:
        select_stmt = select(self.users).where(self.users.c.username == username)
        result = session.execute(select_stmt).first()
        if result:
            print(f"Retrieved user data for '{username}':", result._asdict())
            return result._asdict()
        else:
            print(f"No user found with username '{username}'.")
            return None
    except Exception as e:
        print(f"Error retrieving user '{username}': {e}")
        return None
    finally:
        session.close()
        
# Update a user's role or password
def update_user(self, username, new_role=None, new_password=None):
    session = self.Session()
    try:
        update_data = {"updated_at": datetime.now()}
        if new_password:
            update_data["password_hash"] = self._hash_password(new_password)
        if new_role:
            update_data["role"] = new_role
            
        update_stmt = (
            update(self.users)
            .where(self.users.c.username == username)
            .values(**update_data)
        )
        result = session.execute(update_stmt)
        session.commit()
        
        if result.rowcount > 0:
            print(f"User '{username}' updated successfully.")
        else:
            print(f"No user found with '{username}'.")
    except Exception as e:
        session.rollback()
        print(f"Error updating user '{username}': {e}")
    finally:
        session.close()
    
# Delete a user by username        
def delete_user(self, username):
    session = self.Session()
    try:
        delete_stmt = delete(self.users).where(self.users.c.username == username)
        result = session.execute(delete_stmt)
        session.commit()
        if result.rowcount > 0:
            print(f"User '{username}' deleted successfully.")
        else:
            print(f"No user found with username '{username}'.")
    except Exception as e:
        session.rollback()
        print(f"Error deleting user '{username}': {e}")
    finally:
        session.close()
        
# Authenticate user by verifying the password
def authenticate_user(self, username, password):
    session = self.Session()
    try:
        select_stmt = select(self.users).where(self.users.c.username == username)
        result = session.execute(select_stmt).first()
        if result and self._verify_password(password, result["password_hash"]):
            print(f"Authentication successful for user '{username}'.")
            return True
        else:
            print(f"Authentication failed for user '{username}'.")
            return False
    except Exception as e:
        print(f"Error authenticating user '{username}': {e}")
        return False
    finally:
        session.close()
        

if __name__ == "__main__":
    print("Placeholder")
