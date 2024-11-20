import sqlite3
import pandas as pd
from pathlib import Path
import logging
import time
from typing import Optional, Union

class Migrator:
    @staticmethod
    def resolve_db_path(db_path: Union[str, Path]) -> Path:
        db_path = Path(db_path)
        if db_path.is_absolute():
            return db_path
        
        return Path(__file__).parents[2] / 'db' / db_path
    
    def __init__(self, source_db: Union[str, Path], target_db: Union[str, Path], max_retries: int = 3, retry_delay: int = 1):
        # Initialize the migrator variables
        self.source_db = self.resolve_db_path(source_db)
        self.target_db = self.resolve_db_path(target_db)
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        # Set up basic logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def _verify_source_exists(self) -> bool:
        return Path(self.source_db).exists()
    
    def _create_target_if_not_exists(self):
        Path(self.target_db).parent.mkdir(parents=True, exist_ok=True)
        if not Path(self.target_db).exists():
            try:
                Path(self.target_db).touch()
                self.logger.info(f"Created new target database: {self.target_db}")
            except Exception as e:
                self.logger.error(f"Failed to create target database: {str(e)}")
                raise
    
    def migrate_table(self, source_table: str, target_table: Optional[str] = None) -> bool:
        if target_table is None:
            target_table = source_table
            
        if not self._verify_source_exists():
            self.logger.error(f"Source database not found: {self.source_db}")
            return False
        
        self._create_target_if_not_exists()
        
        retry_count = 0
        while retry_count < self.max_retries:
            try:
                source_query = f"SELECT * FROM {source_table}"
                df = pd.read_sql_query(source_query, sqlite3.connect(self.source_db))
                
                if df.empty:
                    self.logger.info(f"Source table '{source_table}' is empty")
                    return True
                
                with sqlite3.connect(self.target_db) as conn:
                    df.to_sql(
                        name=target_table,
                        con=conn,
                        if_exists='replace',
                        index=False
                    )
                    
                self.logger.info(
                    f"Successfully migrated table '{len(df)}' rows from '{source_table}' to '{target_table}'"
                )
                return True
            
            except sqlite3.OperationalError as e:
                self.logger.error(f"SQLite operational error: {str(e)}")
                retry_count += 1
                if retry_count < self.max_retries:
                    self.logger.info(f"Retrying in {self.retry_delay} seconds..."
                                    f"(Attempt {retry_count + 1}/{self.max_retries})")
                    
                    time.sleep(self.retry_delay)
                continue
            
            except pd.io.sql.DatabaseError as e:
                self.logger.error(f"Database error: {str(e)}")
                return False
            
            except Exception as e:
                self.logger.error(f"Unexpected error during migration: {str(e)}")
                return False
            
        self.logger.error(f"Failed to migrate table '{source_table}' after {self.max_retries} attempts")
        return False
    
if __name__ == "__main__":
    migrator = Migrator(
        source_db="nyse_data.db",
        target_db="ct_jobs_schedule.db",
        max_retries=3,
        retry_delay=2
    )
    
    success = migrator.migrate_table("jobs_schedule")
    
    if success:
        print("Migration completed successfully.")
    else:
        print("Migration failed.")