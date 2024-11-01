import os
from sqlalchemy import select, update, func
from cryptography.fernet import Fernet


class ApiKeyManager:
    def __init__(self, session, api_keys_table, cipher):
        self.Session = session
        self.api_keys = api_keys_table
        self.cipher = cipher

    def encrypt_api_key(self, api_key):
        return self.cipher.encrypt(api_key.encode()).decode()

    def decrypt_api_key(self, encrypted_api_key):
        return self.cipher.decrypt(encrypted_api_key.encode()).decode()

    def delete_api_key(self, service):
        session = self.Session()
        try:
            delete_stmt = self.api_keys.delete().where(
                self.api_keys.c.service == service
            )
            result = session.execute(delete_stmt)
            session.commit()
            if result.rowcount > 0:
                print(f"API key for {service} deleted successfully.")
            else:
                print(f"No API key found for {service}.")
        except Exception as e:
            session.rollback()
            print(f"Error deleting API key for {service}: {e}")
        finally:
            session.close()

    def insert_api_key(self, service, api_key):
        session = self.Session()
        encrypted_key = self.encrypt_api_key(api_key)
        try:
            select_stmt = select(self.api_keys.c.encrypted_api_key).where(
                self.api_keys.c.service == service
            )
            result = session.execute(select_stmt)
            existing_key = result.scalar()

            if existing_key:
                update_stmt = (
                    update(self.api_keys)
                    .where(self.api_keys.c.service == service)
                    .values(encrypted_api_key=encrypted_key, updated_at=func.now())
                )
                session.execute(update_stmt)
                print(f"API key for {service} updated successfully.")
            else:
                insert_stmt = self.api_keys.insert().values(
                    service=service, encrypted_api_key=encrypted_key
                )
                session.execute(insert_stmt)
                print(f"API key for {service} inserted successfully.")
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Error inserting/updating API key for {service}: {e}")
        finally:
            session.close()

    def select_api_key(self, service):
        session = self.Session()
        try:
            select_stmt = select(self.api_keys.c.encrypted_api_key).where(
                self.api_keys.c.service == service
            )
            result = session.execute(select_stmt)
            encrypted_key = result.scalar()

            if encrypted_key:
                decrypted_key = self.decrypt_api_key(encrypted_key)
                print(f"API key for {service}: {decrypted_key}")
                return decrypted_key
            else:
                print(f"No API key found for {service}.")
                return None
        except Exception as e:
            print(f"Error selecting API key for {service}: {e}")
            return None
        finally:
            session.close()

    def select_all_api_keys(self):
        session = self.Session()

        try:
            select_stmt = select(
                self.api_keys.c.service,
                self.api_keys.c.encrypted_api_key,
                self.api_keys.c.created_at,
                self.api_keys.c.updated_at,
            )
            result = session.execute(select_stmt)
            rows = result.fetchall()

            api_keys_list = []

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
            if not api_keys_list:
                print("No API keys found.")
            else:
                print(f"Retrieved {len(api_keys_list)} API keys.")

            return api_keys_list
        except Exception as e:
            print(f"Error selecting all API keys: {e}")
            return []
        finally:
            session.close()
