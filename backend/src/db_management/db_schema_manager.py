# db_management/db_schema_manager.py
import os
from datetime import datetime, timezone
from sqlalchemy import (
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    PrimaryKeyConstraint,
    Index,
    func,
)
import logging

logger = logging.getLogger(__name__)


class DBSchemaManager:
    def __init__(self):
        # Initialize metadata for schema management
        self.scrape_metadata = MetaData()
        self.users_metadata = MetaData()
        self.api_keys_metadata = MetaData()
        self.polygon_stocks_metadata = MetaData()
        self.jobs_schedule_metadata = MetaData()
        self.scrape_ticker_metadata = MetaData()

        # Initialize the database file path, creating it if necessary
        (
            self.scrape_db_file_path,
            self.users_db_file_path,
            self.api_keys_db_file_path,
            self.polygon_stocks_db_file_path,
            self.jobs_schedule_db_file_path,
            self.scrape_ticker_db_file_path,
        ) = self._initialize_database()

    def _initialize_database(self):
        # Create a folder for the database if it does not exist
        if not os.path.exists("db"):
            os.makedirs("db")

        # Set the path for the SQLite database file
        scrape_db_file_path = os.path.join("db", "nyse_scrape_data.db")
        users_db_file_path = os.path.join("db", "ct_users.db")
        api_keys_db_file_path = os.path.join("db", "ct_api_keys.db")
        polygon_stocks_db_file_path = os.path.join("db", "nyse_polygon_stocks_agg.db")
        jobs_schedule_db_file_path = os.path.join("db", "ct_jobs_schedule.db")
        scrape_ticker_db_file_path = os.path.join("db", "nyse_scrape_ticker_data.db")

        logger.debug("Scrape database path: %s", scrape_db_file_path)
        logger.debug("Users database path: %s", users_db_file_path)
        logger.debug("API Keys database path: %s", api_keys_db_file_path)
        logger.debug("Polygon Stocks Aggregated Average database path: %s", polygon_stocks_db_file_path)
        logger.debug("Jobs Schedule database path: %s", jobs_schedule_db_file_path)
        logger.debug("Scrape Ticker database path: %s", scrape_ticker_db_file_path)

        return (
            scrape_db_file_path,
            users_db_file_path,
            api_keys_db_file_path,
            polygon_stocks_db_file_path,
            jobs_schedule_db_file_path,
            scrape_ticker_db_file_path,
        )

    def define_tables(self):
        # Define the stocks table with columns for stock data
        stocks = Table(
            "stocks",
            self.polygon_stocks_metadata,
            Column("ticker_symbol", String),
            Column("close_price", Float),
            Column("highest_price", Float),
            Column("lowest_price", Float),
            Column("open_price", Float),
            Column("timestamp_end", Integer),
            Column("insert_timestamp", DateTime),
            PrimaryKeyConstraint("ticker_symbol", "timestamp_end"),
        )

        # Create an index on stocks for fast lookup by timestamp_end and ticker_symbol
        Index(
            "idx_stocks_timestamp_ticker",
            stocks.c.ticker_symbol,
            stocks.c.timestamp_end,
        )

        # Define the api_keys table for storing encrypted API keys
        api_keys = Table(
            "api_keys",
            self.api_keys_metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("service", String, unique=True, nullable=False),
            Column("encrypted_api_key", String, nullable=False),
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc),
            ),
        )

        # Define the users table for managing user accounts and preferences
        users = Table(
            "users",
            self.users_metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("username", String, unique=True, nullable=False),
            Column("password_hash", String, nullable=False),
            Column("role", String, nullable=False),  # Possible roles: admin, user and guest
            Column("email", String),
            Column("theme_preference", String, default="Dark"),  # Possible themes: Light, Dark
            Column("currency_preference", String, default="USD"),  # Possible currencies: USD, EUR, GBP, etc
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)),
        )

        # Define the stocks_scrape table for storing scraped stock data
        stocks_scrape = Table(
            "stocks_scrape",
            self.scrape_metadata,
            Column("ticker_symbol", String, nullable=False),
            Column("company_name", String),
            Column("price", Float),
            Column("change", Float),
            Column("industry", String),
            Column("volume", Float),
            Column("pe_ratio", Float),
            Column("timestamp", DateTime, nullable=False),  # New timestamp column
            PrimaryKeyConstraint("ticker_symbol", "timestamp"),  # Composite primary key
        )

        # Create an index on stocks for fast lookup by timestamp_end and ticker_symbol
        Index(
            "idx_stocks_scrape_timestamp_ticker",
            stocks_scrape.c.ticker_symbol,
            stocks_scrape.c.timestamp,
        )

        # Define the jobs_schedule table for managing scheduled jobs
        jobs_schedule = Table(
            "jobs_schedule",
            self.jobs_schedule_metadata,
            Column("job_type", String, nullable=False),
            Column("service", String, nullable=False),
            Column("status", String, nullable=False),
            Column("owner", String, nullable=False),
            Column("frequency", String, nullable=False),
            Column("scheduled_start_date", DateTime, nullable=False),
            Column("scheduled_end_date", DateTime),
            Column("data_fetch_start_date", DateTime),
            Column("data_fetch_end_date", DateTime),
            Column("interval_days", Integer),
            Column("weekdays", String),
            Column("run_time", String),
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc),),
            PrimaryKeyConstraint("job_type", "service", "frequency", "scheduled_start_date"),
        )
        
        ticker_scrape = Table(
            "ticker_scrape",
            self.scrape_ticker_metadata,
            Column("ticker_symbol", String, primary_key=True),
            Column("enterprise_value", Float),
            Column("market_cap_group", String),
            Column("sector", String),  
            Column("pe_forward", Float),
            Column("exchange", String),  
            Column("dividend_yield", Float),
            Column("dividend_per_share", Float),  
            Column("dividend_growth", Float), 
            Column("dividend_growth_years", Integer),  
            Column("price_change_1w", Float),
            Column("price_change_1m", Float),
            Column("price_change_3m", Float),
            Column("price_change_6m", Float),
            Column("price_change_ytd", Float),
            Column("price_change_1y", Float),
            Column("price_change_3y", Float),
            Column("price_change_5y", Float),
            Column("price_change_10y", Float),
            Column("price_change_15y", Float),
            Column("price_change_20y", Float),
            Column("price_change_52w_low", Float),
            Column("price_change_52w_high", Float),
            Column("all_time_high", Float), 
            Column("all_time_high_change_percentage", Float),
            Column("all_time_low", Float),
            Column("all_time_low_change_percentage", Float),
            Column("analyst_rating", String),
            Column("analyst_count", Integer),
            Column("price_target", Float),
            Column("price_target_diff_percentage", Float),
            Column("open_price", Float),
            Column("low_price", Float),
            Column("high_price", Float),
            Column("previous_close", Float),
            Column("premarket_price", Float),
            Column("premarket_change_percentage", Float),
            Column("after_hours_price", Float),
            Column("after_hours_change_percentage", Float),
            Column("52w_low", Float),
            Column("52w_high", Float),
            Column("country", String),
            Column("employees", Integer),
            Column("employees_change", Float),
            Column("employees_change_percentage", Float),
            Column("founded", String),
            Column("ipo_date", String),
            Column("financial_report_date", String),
            Column("fiscal_year_end", String),
            Column("last_10k_filing_date", String),
            Column("revenue", Integer),
            Column("revenue_growth_percentage", Float),
            Column("revenue_growth_percentage_q", Float),
            Column("revenue_growth_percentage_3y", Float),
            Column("revenue_growth_percentage_5y", Float),
            Column("gross_profit", Integer),
            Column("gross_profit_growth_percentage", Float),
            Column("gross_profit_growth_percentage_q", Float),
            Column("gross_profit_growth_percentage_3y", Float),
            Column("gross_profit_growth_percentage_5y", Float),
            Column("operating_income", Integer),
            Column("operating_income_growth_percentage", Float),
            Column("operating_income_growth_percentage_q", Float),
            Column("operating_income_growth_percentage_3y", Float),
            Column("operating_income_growth_percentage_5y", Float),
            Column("net_income", Integer),
            Column("net_income_growth_percentage", Float),
            Column("net_income_growth_percentage_q", Float),
            Column("net_income_growth_percentage_3y", Float),
            Column("net_income_growth_percentage_5y", Float),
            Column("income_tax", Float),
            Column("earnings_per_share", Float),
            Column("eps_growth_percentage", Float),
            Column("eps_growth_percentage_q", Float),
            Column("eps_growth_percentage_3y", Float),
            Column("eps_growth_percentage_5y", Float),
            Column("ebit", Integer),
            Column("ebitda", Integer),
            Column("operating_cash_flow", Integer),
            Column("stock_based_compensation", Integer),            
            Column("sbc_by_revenue", Float),
            Column("investing_cash_flow", Integer),
            Column("financing_cash_flow", Integer),
            Column("net_cash_flow", Integer),
            Column("capital_expenditures", Integer),
            Column("free_cash_flow", Integer),
            Column("adjusted_free_cash_flow", Integer),
            Column("free_cash_flow_per_share", Float),
            Column("free_cash_flow_growth_percentage", Float),
            Column("free_cash_flow_growth_percentage_q", Float),
            Column("free_cash_flow_growth_percentage_3y", Float),
            Column("free_cash_flow_growth_percentage_5y", Float),
            Column("total_cash", Integer),
            Column("total_debt", Integer), 
            Column("debt_growth_percentage_yoy", Float),
            Column("debt_growth_percentage_qoq", Float),
            Column("debt_growth_percentage_3y", Float),
            Column("debt_growth_percentage_5y", Float),
            Column("net_cash", Integer),
            Column("net_cash_growth_percentage", Float),
            Column("net_cash_by_market_cap", Float),
            Column("assets", Integer),
            Column("liabilities", Integer),
            Column("gross_margin", Float),
            Column("operating_margin", Float),
            Column("profit_margin", Float),
            Column("free_cash_flow_margin", Float),
            Column("ebitda_margin", Float),
            Column("ebit_margin", Float),
            Column("research_and_development", Integer),
            Column("rnd_by_revenue", Float),
            Column("ps_ratio", Float),
            Column("forward_ps", Float),
            Column("pb_ratio", Float),
            Column("p_by_free_cash_flow_ratio", Float),
            Column("peg_ratio", Float),
            Column("ev_sales", Float),
            Column("ev_sales_forward", Float),
            Column("ev_earnings", Float),
            Column("ev_ebitda", Float),
            Column("ev_ebit", Float),
            Column("ev_fcf", Float),
            Column("earnings_yield", Float),
            Column("free_cash_flow_yield", Float),
            Column("payout_ratio", Float),
            Column("payout_frequency", String),
            Column("buyback_yield", Float),
            Column("shareholder_yield", Float),
            Column("average_volume", Float),
            Column("relative_volume", Float),
            Column("beta_1y", Float),
            Column("relative_strength_index", Float),
            Column("short_float", Float),
            Column("short_shares", Float),
            Column("short_ratio", Float),
            Column("shares_out", Float),
            Column("float", Float),
            Column("shares_yoy", Float),
            Column("shares_insiders", Float),
            Column("shares_institutions", Float),
            Column("earnings_date", String),
            Column("is_spac", String),
            Column("ex_div_date", String),
            Column("payment_date", String),
            Column("return_on_equity", Float),
            Column("return_on_assets", Float),
            Column("return_on_capital", Float),
            Column("return_on_equity_5y", Float),
            Column("return_on_assets_5y", Float),
            Column("return_on_capital_5y", Float),
            Column("revenue_per_employee", Float),
            Column("profit_per_employee", Float),
            Column("asset_turnover", Float),
            Column("inventory_turnover", Float),
            Column("current_ratio", Float),
            Column("quick_ratio", Float),
            Column("debt_equity", Float),
            Column("debt_ebitda", Float),
            Column("debt_fcf", Float),
            Column("effective_tax_rate", Float),
            Column("tax_by_revenue", Float),
            Column("shareholders_equity", Float),
            Column("working_capital", Float),
            Column("last_stock_split_type", String),
            Column("last_stock_split_date", String),
            Column("altman_z_score", Float),
            Column("piotroski_f_score", Integer),
            Column("eps_growth_this_quarter", Float),
            Column("eps_growth_next_quarter", Float),
            Column("eps_growth_this_year", Float),
            Column("eps_growth_next_year", Float),
            Column("eps_growth_next_5y", Float),
            Column("revenue_growth_this_quarter", Float),
            Column("revenue_growth_next_quarter", Float),
            Column("revenue_growth_this_year", Float),
            Column("revenue_growth_next_year", Float),
            Column("revenue_growth_next_5y", Float),
            Column("in_index", String),
            Column("views", Integer),
            Column("interest_coverage_ratio", Float),
            Column("return_from_ipo_price", Float),
            Column("return_from_open_price", Float),
            Column("50_day_moving_average", Float),
            Column("200_day_moving_average", Float),
            Column("price_change_50_day_moving_average", Float),
            Column("price_change_200_day_moving_average", Float),
            Column("created_at", DateTime, default=datetime.now(timezone.utc)),
            Column("updated_at", DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)),
        )

        # Return all defined tables for easy access
        return stocks, api_keys, users, stocks_scrape, jobs_schedule, ticker_scrape
