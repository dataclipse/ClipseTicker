
from datetime import datetime, timezone, timedelta
from .db_manager import DBManager
import logging 
logger = logging.getLogger(__name__)

class AuditManager():
    
    def __init__(self):
        self.db_manager = DBManager()

    def fetch_and_convert(self):
        try:
            scrapes = self.db_manager.scrape_manager.get_scrapes()
            logger.info(f"Found {len(scrapes)} scrapes")
            if not scrapes:
                logger.info("No scrapes found")
                return []
            
            converted_scrapes = []
            for scrape in scrapes: 
                ct_time = scrape.get('timestamp')
                ct_time = datetime.strftime(ct_time, '%Y-%m-%d %H:%M:%S')
                #logger.info(f"Converting {ct_time}")
                ticker = scrape.get('ticker_symbol')
                if ct_time:
                    ct_datetime = datetime.strptime(ct_time, '%Y-%m-%d %H:%M:%S')
                    ct_datetime = ct_datetime.replace(tzinfo=timezone(timedelta(hours=-6)))
                    
                    utc_datetime = ct_datetime.astimezone(timezone.utc)
                    
                    new_timestamp = utc_datetime.strftime('%Y-%m-%d %H:%M:%S')
                
                self.db_manager.scrape_manager.replace_scrape(ticker, ct_time, new_timestamp)
                converted_scrapes.append(new_timestamp)
                logger.info(f"Updated timestamp for {ticker} to {new_timestamp}")
                
            logger.info(f"Successfully converted {len(converted_scrapes)} scrapes to UTC") 
            return scrapes
        
        except Exception as e:
            logger.error(f"Error {e}")
            return []
