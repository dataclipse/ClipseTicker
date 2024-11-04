# routes/stocks_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
import jwt
from  functools import wraps

# Initialize Blueprint
stocks_bp = Blueprint('stocks', __name__)

# Initialize db_manager
db_manager = DBManager()

# Token protection decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            # Remove 'Bearer ' prefix if it exists
            if token.startswith('Bearer '):
                token = token.split(" ")[1]
            # Decode token
            decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            request.user = decoded_token
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token is expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid Token'}), 403
        
        return f(*args, **kwargs)
    return decorated

@stocks_bp.route('/api/stocks', methods=["GET"])
@token_required
def get_stocks():
    try:
        stocks_data = db_manager.stock_manager.get_recent_stock_prices()
        return jsonify(stocks_data), 200
    except Exception as e:
        print(f"Error retrieving stock data: {e}")
        return jsonify({"error": "Unable to retrieve stock data"}), 500

@stocks_bp.route('/api/stocks/<string:ticker_symbol>', methods=["GET"])
@token_required
def get_stock_by_ticker(ticker_symbol):
    try:
        stock_data = db_manager.stock_manager.get_stock_data_by_ticker(ticker_symbol)
        if stock_data is None:
            return jsonify({"error": f"No Data found for ticker symbol '{ticker_symbol}'"}), 404
        return jsonify(stock_data), 200
    except Exception as e:
        print(f"Error retrieving stock data for ticker symbol '{ticker_symbol}': {e}")
        return jsonify({"error": f"Unable to retrieve stock data"}), 500