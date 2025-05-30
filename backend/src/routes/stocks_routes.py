# routes/stocks_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
import jwt
from  functools import wraps
import logging
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
logger = logging.getLogger(__name__)

# Initialize Blueprint
stocks_bp = Blueprint('stocks', __name__)

# Initialize db_manager
db_manager = DBManager()

# Token protection decorator
def token_required(f):
    # Decorator to enforce authentication on routes by requiring a valid JWT token in request headers
    @wraps(f) # Preserve the original function’s metadata
    def decorated(*args, **kwargs):
        # Retrieve the token from the 'Authorization' header in the request
        token = request.headers.get('Authorization')
        
        # Check if the token is missing
        if not token:
            # Return a 403 error if the token is not provided
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            # Remove 'Bearer ' prefix if it exists in the token
            if token.startswith('Bearer '):
                token = token.split(" ")[1]  # Extract the actual token string
                
            # Decode the token using the app's secret key and the HS256 algorithm
            decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Attach the decoded token data to the request object for access in the protected route
            request.user = decoded_token
        except jwt.ExpiredSignatureError:
            # Handle the error if the token has expired
            return jsonify({'error': 'Token is expired'}), 401
        except jwt.InvalidTokenError:
            # Handle the error if the token is invalid
            return jsonify({'error': 'Invalid Token'}), 403
        # Call the original function if the token is valid
        return f(*args, **kwargs)
    
    # Return the decorated function with token validation applied
    return decorated

@stocks_bp.route('/api/stocks', methods=["GET"])
@token_required
def get_stocks():
    # Retrieve recent stock prices and return them as a JSON response
    try:
        # Call the stock manager to fetch recent stock prices
        stocks_data = db_manager.stock_manager.get_recent_stock_prices()
        
        # Return the stock data as a JSON response with a 200 status code
        return jsonify(stocks_data), 200
    except Exception as e:
        # Log any error that occurs during data retrieval
        logger.error(f"Error retrieving stock data: {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": "Unable to retrieve stock data"}), 500

@stocks_bp.route('/api/stocks/<string:ticker_symbol>', methods=["GET"])
@token_required
def get_stock_by_ticker(ticker_symbol):
    # Retrieve stock data for a specific ticker symbol and return it as a JSON response
    try:
        # Call the stock manager to fetch data for the specified ticker symbol
        stock_data = db_manager.stock_manager.get_stock_data_by_ticker(ticker_symbol)
        
        # Check if any data was returned for the ticker symbol
        if stock_data is None:
            # Return a 404 error if no data was found
            return jsonify({"error": f"No Data found for ticker symbol '{ticker_symbol}'"}), 404
        
        # Return the stock data as a JSON response with a 200 status code
        return jsonify(stock_data), 200
    except Exception as e:
        # Log any error that occurs during data retrieval
        logger.error(f"Error retrieving stock data for ticker symbol '{ticker_symbol}': {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": f"Unable to retrieve stock data"}), 500
    
@stocks_bp.route('/api/stock_scrapes', methods=["GET"])
@token_required
def get_stock_scrapes():
    # Retrieve recent stock scrapes and return them as a JSON response
    try:
        # Call the stock manager to fetch recent stock scrapes
        stock_scrapes_data = db_manager.scrape_manager.get_recent_stock_scrapes()
        # Return the stock scrapes data as a JSON response with a 200 status code
        return jsonify(stock_scrapes_data), 200
    except Exception as e:
        # Log any error that occurs during data retrieval
        logger.error(f"Error retrieving stock scrapes: {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": "Unable to retrieve stock scrapes"}), 500

@stocks_bp.route('/api/stock_scrapes/<string:ticker_symbol>', methods=["GET"])
@token_required
def get_stock_scrape_by_ticker(ticker_symbol):
    # Retrieve stock scrape data for a specific ticker symbol and return it as a JSON response
    try:
        # Call the stock manager to fetch data for the specified ticker symbol
        stock_scrape_data = db_manager.scrape_manager.get_stock_scrape_data_by_ticker(ticker_symbol)
        
        # Check if any data was returned for the ticker symbol
        if stock_scrape_data is None:
            # Return a 404 error if no data was found
            return jsonify({"error": f"No Data found for ticker symbol '{ticker_symbol}'"}), 404
        
        # Return the stock scrape data as a JSON response with a 200 status code
        return jsonify(stock_scrape_data), 200
    except Exception as e:
        # Log any error that occurs during data retrieval
        logger.error(f"Error retrieving stock scrape data for ticker symbol '{ticker_symbol}': {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": f"Unable to retrieve stock scrape data"}), 500

@stocks_bp.route('/api/scrape_ticker_stats/<string:ticker_symbol>', methods=["GET"])
@token_required
def get_stock_scrape_ticker_stats(ticker_symbol):
        # Retrieve stock scrape data for a specific ticker symbol and return it as a JSON response
    try:
        # Call the stock manager to fetch data for the specified ticker symbol
        stock_scrape_data = db_manager.scrape_manager.get_scrape_ticker_stats(ticker_symbol)
        
        # Check if any data was returned for the ticker symbol
        if stock_scrape_data is None:
            # Return a 404 error if no data was found
            return jsonify({"error": f"No Data found for ticker symbol '{ticker_symbol}'"}), 404
        
        # Return the stock scrape data as a JSON response with a 200 status code
        return jsonify(stock_scrape_data), 200
    except Exception as e:
        # Log any error that occurs during data retrieval
        logger.error(f"Error retrieving stock scrape data for ticker symbol '{ticker_symbol}': {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": f"Unable to retrieve stock scrape data"}), 500
    
@stocks_bp.route('/api/rss/marketwatch', methods=["GET"])
@token_required
def get_marketwatch_rss():
    try:
        # Fetch RSS feed from MarketWatch
        rss_url = 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse'
        response = requests.get(rss_url)
        response.raise_for_status()
        
        # Parse the RSS XML
        root = ET.fromstring(response.content)
        
        # Find all items in the RSS feed
        items = root.findall('.//item')
        
        # Process and limit to 15 items
        news_items = []
        for item in items[:15]:
            title = item.find('title').text if item.find('title') is not None else ''
            link = item.find('link').text if item.find('link') is not None else ''
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ''
            
            # Parse date and format it
            try:
                parsed_date = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %z')
                formatted_date = parsed_date.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                formatted_date = pub_date
                
            news_items.append({
                'title': title,
                'link': link,
                'pubDate': formatted_date
            })
            
        return jsonify(news_items), 200
    
    except requests.RequestException as e:
        logger.error(f'Error fetching MarketWatch RSS: {e}')
        return jsonify({'error': 'Failed to fetch news feed'}), 500
    except ET.ParseError as e:
        logger.error(f'Error parsing RSS feed: {e}')
        return jsonify({'error': 'Failed to parse RSS feed'}), 500
    except Exception as e:
        logger.error(f'Unexpected Error: {e}')
        return jsonify({'error': 'An unexpected error occurred'}), 500