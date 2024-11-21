# db_management/api_key_manager.py
from sqlalchemy import select, update, func
import logging 
import time
from datetime import datetime, timezone
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

class ApiKeyManager:
    def __init__(self, session, api_keys_table, cipher):
        # Initialize the session, API keys table, and cipher for encryption/decryption
        self.Session = session
        self.api_keys = api_keys_table
        self.cipher = cipher

    def encrypt_api_key(self, api_key):
        # Encrypt the API key using the provided cipher
        return self.cipher.encrypt(api_key.encode()).decode()

    def decrypt_api_key(self, encrypted_api_key):
        # Decrypt the encrypted API key using the provided cipher
        return self.cipher.decrypt(encrypted_api_key.encode()).decode()

    @retry_on_exception()
    def delete_api_key(self, service):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Prepare a delete statement for the API key of the specified service
            delete_stmt = self.api_keys.delete().where(
                self.api_keys.c.service == service
            )
            
            # Execute the delete statement
            result = session.execute(delete_stmt)
            session.commit()
            
            # Confirm deletion or log if no key was found
            if result.rowcount > 0:
                logger.debug(f"API key for {service} deleted successfully.")
            else:
                logger.debug(f"No API key found for {service}.")
                
        except Exception as e:
            # Rollback if an error occurs and log the error
            session.rollback()
            logger.error(f"Error deleting API key for {service}: {e}")
            
        finally:
            # Close the session to free up resources
            session.close()

    @retry_on_exception()
    def insert_api_key(self, service, api_key):
        # Open a new session for database interaction
        session = self.Session()
        # Encrypt the API key
        encrypted_key = self.encrypt_api_key(api_key)
        
        try:
            # Check if an API key already exists for the specified service
            select_stmt = select(self.api_keys.c.encrypted_api_key).where(
                self.api_keys.c.service == service
            )
            
            # Execute the select statement
            result = session.execute(select_stmt)
            
            # Get the existing API key if it exists
            existing_key = result.scalar()

            if existing_key:
                # Update existing API key if found
                update_stmt = (
                    update(self.api_keys)
                    .where(self.api_keys.c.service == service)
                    .values(encrypted_api_key=encrypted_key, updated_at=datetime.now(timezone.utc))
                )

                # Execute the update statement
                session.execute(update_stmt)
                logger.debug(f"API key for {service} updated successfully.")
            
            else:
                # Insert new API key if none exists for the service
                insert_stmt = self.api_keys.insert().values(
                    service=service, encrypted_api_key=encrypted_key
                )
            
                # Execute the insert statement
                session.execute(insert_stmt)
                logger.debug(f"API key for {service} inserted successfully.")
            
            # Commit the transaction
            session.commit()
        
        except Exception as e:
            # Rollback if an error occurs and log the error
            session.rollback()
            logger.error(f"Error inserting/updating API key for {service}: {e}")
        
        finally:
            # Close the session to free up resources
            session.close()

    @retry_on_exception()
    def select_api_key(self, service):
        # Open a new session for database interaction
        session = self.Session()
        try:
            # Query the encrypted API key for the specified service
            select_stmt = select(self.api_keys.c.encrypted_api_key).where(
                self.api_keys.c.service == service
            )
            
            # Execute the select statement
            result = session.execute(select_stmt)
            encrypted_key = result.scalar()

            if encrypted_key:
                # Decrypt and return the API key if found
                decrypted_key = self.decrypt_api_key(encrypted_key)
                logger.debug(f"API key for {service}: {decrypted_key}")
                return decrypted_key
            
            else:
                # Log if no API key is found for the service
                logger.debug(f"No API key found for {service}.")
                return None
            
        except Exception as e:
            # Log any error that occurs
            logger.error(f"Error selecting API key for {service}: {e}")
            return None
        
        finally:
            # Close the session to free up resources
            session.close()

    @retry_on_exception()
    def select_all_api_keys(self):
        # Open a new session for database interaction
        session = self.Session()

        try:
            # Query all API keys with their service, creation, and update timestamps
            select_stmt = select(
                self.api_keys.c.service,
                self.api_keys.c.encrypted_api_key,
                self.api_keys.c.created_at,
                self.api_keys.c.updated_at,
            )
            # Execute the select statement
            result = session.execute(select_stmt)
            rows = result.fetchall()

            # Initialize a list to store API key information
            api_keys_list = []

            # Decrypt each API key and store relevant information in a list
            for row in rows:
                service = row.service
                encrypted_api_key = row.encrypted_api_key
                decrypted_api_key = self.decrypt_api_key(encrypted_api_key)
                created_at = row.created_at
                updated_at = row.updated_at
                api_keys_list.append(
                    {
                        "service": service,
                        "api_key": decrypted_api_key,
                        "created_at": created_at,
                        "updated_at": updated_at,
                    }
                )
            
            # Log the number of API keys retrieved or that none were found
            if not api_keys_list:
                logger.debug("No API keys found.")
            else:
                logger.debug(f"Retrieved {len(api_keys_list)} API keys.")

            # Return the list of API keys
            return api_keys_list
        
        except Exception as e:
            # Log any error that occurs
            logger.error(f"Error selecting all API keys: {e}")
            return []
        
        finally:
            # Close the session to free up resources
            session.close()
