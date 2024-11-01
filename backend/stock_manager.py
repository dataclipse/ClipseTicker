from sqlalchemy import select, update, func
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from datetime import datetime

class StockManager:
    def __init__(self, session, stocks_table):
        self.Session = session
        self.stocks = stocks_table
        
    def insert_stock(self, ticker, close_price, highest_price, lowest_price, open_price, timestamp_end, timestamp):
        session = self.Session()
        try:
            select_stmt = select(self.stocks).where(
                self.stocks.c.ticker_symbol == ticker,
                self.stocks.c.timestamp_end == timestamp_end,
            )
            result = session.execute(select_stmt)
            existing_stock = result.fetchone()
            
            if existing_stock:
                update_stmt = (
                    update(self.stocks)
                    .where(
                        self.stocks.c.ticker_symbol == ticker,
                        self.stocks.c.timestamp_end == timestamp_end,
                    )
                    .values(
                        close_price=close_price,
                        highest_price=highest_price,
                        lowest_price=lowest_price,
                        open_price=open_price,
                        insert_timestamp=timestamp,
                    )
                )
                session.execute(update_stmt)
                print(f"Stock data for {ticker} at {timestamp_end} updated successfully.")
            else:
                insert_stmt = self.stocks.insert().values(
                    ticker_symbol=ticker,
                    close_price=close_price,
                    highest_price=highest_price,
                    lowest_price=lowest_price,
                    open_price=open_price,
                    timestamp_end=timestamp_end,
                    insert_timestamp=timestamp,
                )
                session.execute(insert_stmt)
                print(f"Stock data for {ticker} at {timestamp_end} inserted successfully.")
            
            session.commit()
        except Exception as e:
            print(f"Error inserting stock data: {e}")
            session.rollback()
        finally:
            session.close()
            
    def select_stock(self):
        session = self.Session()
        try:
            select_stmt = select(self.stocks)
            result = session.execute(select_stmt)
            rows = result.fetchall()
            
            if rows:
                print("Retrieved stock data:")
                for row in rows:
                    id, ticker, price, timestamp = row
                    print(f"ID: {id}, Ticker: {ticker}, Price: {price}, Timestamp: {timestamp}")
            else:
                print("No stock data found.")
        except Exception as e:
            session.rollback()
            print(f"Error selecting stock data: {e}")
        finally:
            session.close()
            
    def insert_stock_batch(self, stock_data_batch):
        session = self.Session()
        try:
            for stock in stock_data_batch:
                ticker_symbol = stock["T"]
                close_price = stock["c"]
                highest_price = stock["h"]
                lowest_price = stock["l"]
                open_price = stock["o"]
                timestamp_end = stock["t"]
                insert_timestamp = datetime.now()
                
                insert_stmt = (
                    sqlite_insert(self.stocks)
                    .values(
                        ticker_symbol=ticker_symbol,
                        close_price=close_price,
                        highest_price=highest_price,
                        lowest_price=lowest_price,
                        open_price=open_price,
                        timestamp_end=timestamp_end,
                        insert_timestamp=insert_timestamp,
                    )
                    .prefix_with("OR REPLACE")
                )
                
                session.execute(insert_stmt)
            
            session.commit()
            print(f"Inserted or update batch of {len(stock_data_batch)} stock entries successfully.")
            
        except Exception as e:
            session.rollback()
            print(f"Error during batch upsert: {e}")
        finally:
            session.close()
            
    def get_recent_stock_prices(self):
        session = self.Session()
        try:
            subquery = (
                select(
                    self.stocks.c.ticker_symbol,
                    func.max(self.stocks.c.timestamp_end).label("max_timestamp"),
                )
                .group_by(self.stocks.c.ticker_symbol)
                .subquery()
            )
            
            query = select(
                self.stocks.c.ticker_symbol,
                self.stocks.c.open_price,
                self.stocks.c.close_price,
                self.stocks.c.highest_price,
                self.stocks.c.lowest_price,
                self.stocks.c.timestamp_end,
                subquery.c.max_timestamp,
            ).join(
                subquery,
                (self.stocks.c.ticker_symbol == subquery.c.ticker_symbol)
                & (self.stocks.c.timestamp_end == subquery.c.max_timestamp),
            )
            
            result = session.execute(query)
            
            stocks_data = [
                {
                    "ticker_symbol": row.ticker_symbol,
                    "open_price": row.open_price,
                    "close_price": row.close_price,
                    "highest_price": row.highest_price,
                    "lowest_price": row.lowest_price,
                    "timestamp_end": row.max_timestamp,
                }
                for row in result
            ]
            
            return stocks_data
        except Exception as e:
            print(f"Error retrieving recent stock prices: {e}")
            return []
        finally:
            session.close()
            
    def get_stock_data_by_ticker(self, ticker_symbol):
        session = self.Session()
        try:
            query = select(
                self.stocks.c.ticker_symbol,
                self.stocks.c.open_price,
                self.stocks.c.close_price,
                self.stocks.c.highest_price,
                self.stocks.c.lowest_price,
                self.stocks.c.timestamp_end,
            ).where(self.stocks.c.ticker_symbol == ticker_symbol)
            
            result = session.execute(query)
            
            stocks_data = [
                {
                    "ticker_symbol": row.ticker_symbol,
                    "open_price": row.open_price,
                    "close_price": row.close_price,
                    "highest_price": row.highest_price,
                    "lowest_price": row.lowest_price,
                    "timestamp_end": row.timestamp_end,
                }
                for row in result
            ]
            
            return stocks_data
        except Exception as e:
            print(f"Error retrieving stock data for '{ticker_symbol}': {e}")
            return []
        finally:
            session.close()
            