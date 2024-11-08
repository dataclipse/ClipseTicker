from sqlalchemy import select, insert, update, delete
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

class ScrapeManager:
    def __init__(self, session, scrape_table):
        self.Session = session
        self.scrape = scrape_table
    
    def create_scrape_batch(self, stock_data_list):
        session = self.Session()
        try:
            # Use `insert` with the table object and execute with a list of dictionaries for batch insertion
            insert_stmt = insert(self.scrape)
            session.execute(insert_stmt, stock_data_list)
            session.commit()
            print(f"Batch insert of {len(stock_data_list)} records completed successfully.")
        except Exception as e:
            print(f"Error creating scrape batch: {e}")
            session.rollback()
        finally:
            session.close()
        
    def create_scrape(self, ticker_symbol, company_name, price, change, industry, volume=None, pe_ratio=None, timestamp=None):
        session = self.Session()
        try:
            insert_stmt = self.scrape.insert().values(
                ticker_symbol=ticker_symbol,
                company_name=company_name,
                price=price,
                change=change,
                industry=industry,
                volume=volume if volume is not None else 0.0,
                pe_ratio=pe_ratio if pe_ratio is not None else 0.0,
                timestamp=timestamp or datetime.now()
            )
            session.execute(insert_stmt)
            session.commit()
            print(f"Scrape for {ticker_symbol} at {timestamp} created successfully.")
        except SQLAlchemyError as e:
            print(f"Error creating scrape: {e}")
            session.rollback()
        finally:
            session.close()
            
    def get_scrapes(self):
        session = self.Session()
        try:
            select_stmt = select(self.stocks_scrape)
            result = session.execute(select_stmt)
            scrapes = result.fetchall()
            column_names = [column.name for column in self.stocks_scrape.columns]
            scrapes_list = [dict(zip(column_names, row)) for row in scrapes]
            print(f"Retrieved {len(scrapes_list)} scrapes.")
            return scrapes_list
        except SQLAlchemyError as e:
            print(f"Error retrieving scrapes: {e}")
            return []
        finally:
            session.close()

    def get_scrape(self, ticker_symbol, timestamp):
        session = self.Session()
        try:
            select_stmt = select(self.stocks_scrape).where(
                self.stocks_scrape.c.ticker_symbol == ticker_symbol,
                self.stocks_scrape.c.timestamp == timestamp
            )
            result = session.execute(select_stmt).fetchone()
            if result:
                scrape = dict(zip([column.name for column in self.stocks_scrape.columns], result))
                print(f"Scrape for {ticker_symbol} at {timestamp} retrieved successfully.")
                return scrape
            else:
                print("Scrape not found.")
                return None
        except SQLAlchemyError as e:
            print(f"Error retrieving scrape: {e}")
            return None
        finally:
            session.close()
            
    def update_scrape(self, ticker_symbol, timestamp, **kwargs):
        session = self.Session()
        try:
            update_stmt = update(self.stocks_scrape).where(
                self.stocks_scrape.c.ticker_symbol == ticker_symbol,
                self.stocks_scrape.c.timestamp == timestamp
            ).values(**kwargs)
            result = session.execute(update_stmt)
            session.commit()
            if result.rowcount > 0:
                print(f"Scrape for {ticker_symbol} at {timestamp} updated successfully.")
                return True
            else:
                print("Scrape not found for update.")
                return False
        except SQLAlchemyError as e:
            print(f"Error updating scrape: {e}")
            session.rollback()
            return False
        finally:
            session.close()
            
    def delete_scrape(self, ticker_symbol, timestamp):
        session = self.Session()
        try:
            delete_stmt = delete(self.stocks_scrape).where(
                self.stocks_scrape.c.ticker_symbol == ticker_symbol,
                self.stocks_scrape.c.timestamp == timestamp
            )
            result = session.execute(delete_stmt)
            session.commit()
            if result.rowcount > 0:
                print(f"Scrape for {ticker_symbol} at {timestamp} deleted successfully.")
                return True
            else:
                print("Scrape not found for deletion.")
                return False
        except SQLAlchemyError as e:
            print(f"Error deleting scrape: {e}")
            session.rollback()
            return False
        finally:
            session.close()