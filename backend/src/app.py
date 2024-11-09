# app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from .db_manager import DBManager
from .data_ingest.polygon_stock_fetcher import PolygonStockFetcher
from .routes.user_routes import user_bp
from .routes.stocks_routes import stocks_bp
from .routes.api_key_routes import api_key_bp
from .routes.jobs_routes import jobs_bp
import jwt
from  functools import wraps
from datetime import datetime, timedelta, timezone

# Initialize Flask app and enable Cross-Origin Resource Sharing (CORS)
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize database manager and polygon data fetcher instances
db_manager = DBManager()
polygon_fetcher = PolygonStockFetcher()

# Generate or load JWT secret key for encoding tokens
jwt_secret_key_file = "jwt_key.txt"
if os.path.exists(jwt_secret_key_file):
    with open(jwt_secret_key_file, "rb") as file:
        app.config['SECRET_KEY'] = file.read()
else:
    # Generate a new secret key if it does not exist
    jwt_secret_key = os.urandom(24)
    app.config['SECRET_KEY'] = jwt_secret_key
    with open(jwt_secret_key_file, "wb") as file:
        file.write(jwt_secret_key)

# Login route for user authentication
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    # Validate input fields
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    try:
        # Authenticate user through DBManager's user manager
        if db_manager.user_manager.authenticate_user(username, password):
            # Retrieve user details and set token expiration
            user = db_manager.user_manager.get_user_by_username(username)
            expiration = datetime.now(timezone.utc) + timedelta(hours=2)
            
            # Return error if user not found
            if user is None:
                return jsonify({"error": "User not found"}), 404
            
            # Set user role from database
            user_role = user['role']
            
            # Create JWT payload with username, role, and expiration
            payload = {
                "username": username,
                "exp": expiration,
                "iat": datetime.now(),
                "role": user_role,
            }
            
            # Encode the JWT with the app's secret key
            token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({
                "token": token, 
                "role": user_role, 
                "username": username
            }), 200
        else:
            # Return error for invalid credentials
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        # Log error and return server error response
        print(f"Error during authentication for user '{username}': {e}")
        return jsonify({"error": "Authentication error"}), 500
    
# Token protection decorator to enforce JWT token requirements
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Retrieve token from request headers
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token.split(" ")[1]
            # Decode the JWT token using the app's secret key
            decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            # Attach decoded token to the request object for route access
            request.user = decoded_token
        except jwt.ExpiredSignatureError:
            # Return error for expired token
            return jsonify({'error': 'Token is expired'}), 401
        except jwt.InvalidTokenError:
            # Return error for invalid token
            return jsonify({'error': 'Invalid Token'}), 403
        
        # Call the original function if token is valid
        return f(*args, **kwargs)
    return decorated

# Register Blueprints for route modularization
app.register_blueprint(user_bp)
app.register_blueprint(stocks_bp)
app.register_blueprint(api_key_bp)
app.register_blueprint(jobs_bp)

# Start Flask application
if __name__ == "__main__":
    app.run(debug=True)
