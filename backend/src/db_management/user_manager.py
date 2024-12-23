# db_management/user_manager.py
import bcrypt
from datetime import datetime, timezone
from sqlalchemy import select, update, delete
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
import logging
import time
logger = logging.getLogger(__name__)

def retry_on_exception(max_retries=3, delay=1):
    # Decorator to retry a function call if it raises an exception
    def decorator(func):
        # Wrapper function that will replace the original function
        def wrapper(*args, **kwargs):
            # Attempt to call the function up to max_retries times
            for attempt in range(max_retries):
                try:
                    # Call the original function and return its result
                    return func(*args, **kwargs)
                except Exception as e:
                    # If an exception occurs and it's not the last attempt
                    if attempt < max_retries - 1:
                        # Log a warning and wait before retrying
                        logger.warning(f"Retrying {func.__name__} due to error: {e}")
                        time.sleep(delay)
                    else:
                        # Log an error if max retries are exceeded and raise the exception
                        logger.error(f"Max retries exceeded for {func.__name__}: {e}")
                        raise
        return wrapper
    return decorator

class UserManager:
    def __init__(self, session, users_table):
        # Initialize the class with a session factory and a reference to the users table
        self.Session = session
        self.users = users_table

    def _hash_password(self, password):
        # Hash the password using bcrypt for secure storage
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def _verify_password(self, password, hashed_password):
        # Verify the provided password against a stored hashed password using bcrypt
        return bcrypt.checkpw(password.encode(), hashed_password.encode())

    @retry_on_exception()
    def create_user(self, username, password, role):
        # Create a new user in the users table with the provided username, password, and role
        session = self.Session() # Open a new session for database interaction
        try:
            # Hash the provided password for secure storage
            hashed_password = self._hash_password(password)
            # Define the new user data to be inserted
            new_user = {
                "username": username,
                "password_hash": hashed_password,
                "role": role,
                "email": "",
                "theme_preference": "dark",
                "currency_preference": "USD",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            # Prepare the insert statement with the new user data
            insert_stmt = sqlite_insert(self.users).values(new_user)
            # Execute the insert statement to add the new user record
            session.execute(insert_stmt)
            # Commit the transaction to save the new user in the database
            session.commit()
            logger.debug(f"User '{username}' created successfully.")
        except Exception as e:
            # Rollback the transaction if an error occurs to maintain data integrity
            session.rollback()
            logger.error(f"Error creating user '{username}': {e}")
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def get_user_by_username(self, username):
        # Retrieve a user's data from the users table based on the provided username
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a select statement to fetch the user record matching the specified username
            select_stmt = select(self.users).where(self.users.c.username == username)
            # Execute the select statement and retrieve the first matching result
            result = session.execute(select_stmt).first()
            # Check if a user record was found
            if result:
                logger.debug(f"Retrieved user data for '{username}'")
                return result._asdict() # Convert the result to a dictionary and return it
            else:
                # Log a message if no user was found with the specified username
                logger.debug(f"No user found with username '{username}'.")
                return None
        except Exception as e:
            # Log any error that occurs during retrieval
            logger.error(f"Error retrieving user '{username}': {e}")
            return None
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def update_user(self, username, new_username=None, new_role=None, new_password=None, new_email=None, new_currency=None, new_theme=None):
        # Update a user's details in the users table based on the provided parameters
        session = self.Session() # Open a new session for database interaction
        try:
            # Check if a new username is provided and verify it is not already taken
            if new_username:
                existing_user = self.get_user_by_username(new_username)
                if existing_user:
                    return f"Error: Username '{new_username}' already exists."
            # Prepare a dictionary to hold fields that need updating
            update_data = {"updated_at": datetime.now(timezone.utc)} # Always update the timestamp
            # Add fields to update_data only if new values are provided
            if new_username:
                update_data["username"] = new_username
            if new_password:
                update_data["password_hash"] = self._hash_password(new_password) # Hash the new password for secure storage
            if new_role:
                update_data["role"] = new_role
            if new_email:
                update_data["email"] = new_email
            if new_currency:
                update_data["currency_preference"] = new_currency
            if new_theme:
                update_data["theme_preference"] = new_theme
            # Prepare the update statement to modify the user record with the given username
            update_stmt = (
                update(self.users)
                .where(self.users.c.username == username) 
                .values(**update_data) # Apply the updates
            )
            # Execute the update statement
            result = session.execute(update_stmt)
            # Commit the transaction to save the changes in the database
            session.commit()
            # Check if any rows were affected by the update
            if result.rowcount > 0:
                logger.debug(f"User '{username}' updated successfully.")
            else:
                # Log a message if no user was found with the specified username
                logger.debug(f"No user found with '{username}'.")
        except Exception as e:
            # Rollback the transaction if an error occurs and log the error
            session.rollback()
            logger.error(f"Error updating user '{username}': {e}")
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def delete_user(self, username):
        # Delete a user from the users table based on the provided username
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a delete statement to remove the user record with the specified username
            delete_stmt = delete(self.users).where(self.users.c.username == username)
            # Execute the delete statement
            result = session.execute(delete_stmt)
            # Commit the transaction to save changes in the database
            session.commit()
            # Check if any rows were affected by the delete operation
            if result.rowcount > 0:
                logger.debug(f"User '{username}' deleted successfully.")
            else:
                # Log a message if no user was found with the specified username
                logger.debug(f"No user found with username '{username}'.")
        except Exception as e:
            # Rollback the transaction if an error occurs and log the error
            session.rollback()
            logger.error(f"Error deleting user '{username}': {e}")
        finally:
            # Close the session to free resources
            session.close()

    @retry_on_exception()
    def authenticate_user(self, username, password):
        # Authenticate a user by verifying the provided password against the stored hash
        session = self.Session() # Open a new session for database interaction
        try:
            # Prepare a select statement to retrieve the user record with the specified username
            select_stmt = select(self.users).where(self.users.c.username == username)
            # Execute the select statement and retrieve the first matching result
            result = session.execute(select_stmt).first()
            if result:
                # Map the result to a dictionary-like structure for easier access
                user_data = result._mapping
                # Verify the provided password against the stored hashed password
                if self._verify_password(password, user_data["password_hash"]):
                    logger.debug(f"Authentication successful for user '{username}'.")
                    return True # Return True if authentication is successful
                else:
                    logger.debug(f"Authentication failed for user '{username}'.")
                    return False # Return False if password verification fails
            else:
                # Log a message if no user was found with the specified username
                logger.debug(f"No user found with username '{username}'.")
                return False # Return False if no matching user is found
        except Exception as e:
            # Log any error that occurs during authentication
            logger.error(f"Error authenticating user '{username}': {e}")
            return False # Return False if an exception occurs
        finally:
            # Close the session to free resources
            session.close()
