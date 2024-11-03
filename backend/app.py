# app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from db_manager import DBManager
from stock_data_fetcher import PolygonStockFetcher
import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

db_manager = DBManager()
polygon_fetcher = PolygonStockFetcher()

# Create a jwt secret key if one is not present
jwt_secret_key_file = "jwt_key.txt"
if os.path.exists(jwt_secret_key_file):
    with open(jwt_secret_key_file, "rb") as file:
        app.config['SECRET_KEY'] = file.read()
else:
    jwt_secret_key = os.urandom(24)
    app.config['SECRET_KEY'] = jwt_secret_key
    with open(jwt_secret_key_file, "wb") as file:
        file.write(jwt_secret_key)

# Login route
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    try:
        # Authenticate user
        if db_manager.user_manager.authenticate_user(username, password):
            # Define the token expiration
            user = db_manager.user_manager.get_user_by_username(username)
            expiration = datetime.now(timezone.utc) + timedelta(hours=2)
            
            if user is None:
                return jsonify({"error": "User not found"}), 404
            
            user_role = user['role']
            email = user['email']
            currency = user['currency_preference']
            theme = user['theme_preference']
            
            # Generate JWT payload
            payload = {
                "username": username,
                "exp": expiration,
                "iat": datetime.now(),
                "role": user_role,
                "email": email,
                "currency_preference": currency,
                "theme_preference": theme
            }
            
            # Encode JWT with secret key
            token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({
                "token": token, 
                "role": user_role, 
                "username": username, 
                "email": email,
                "currency_preference": currency,
                "theme_preference": theme
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Error during authentication for user '{username}': {e}")
        return jsonify({"error": "Authentication error"}), 500
    
# Token protection (apply to route by adding @token_required)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing"}), 403
        
        try:
            # Remove 'Bearer ' prefix if it exits
            if token.startswith("Bearer"):
                token = token.split(" ")[1]
            # Decode token
            decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            # You can also add user info to the request context if needed
            request.user = decoded_token
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid Token"}), 403
        
        return f(*args, **kwargs)
    return decorated

# User routes
@app.route("/api/user", methods=["PUT"])
@token_required
def update_user():
    data = request.get_json()
    username = data.get("username")
    new_username = data.get("new_username")
    new_password = data.get("new_password")
    new_email = data.get("new_email")
    new_currency = data.get("new_currency")
    new_theme = data.get("new_theme")
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    try:
        # Call the update_user method with provided parameters
        result = db_manager.user_manager.update_user(
            username,
            new_username=new_username, 
            new_password=new_password, 
            new_email=new_email, 
            new_currency=new_currency, 
            new_theme=new_theme
        )
        
        # Check if the result contains an error message
        if isinstance(result, str):
            return jsonify({"error": result}), 400
        
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        print(f"Error updating user '{username}': {e}")
        return jsonify({"error": "Unable to update user"}), 500

@app.route("/api/user/<string:username>", methods=["GET"])
@token_required
def get_user_by_username(username):
    try:
        # Query the user profile by username
        user = db_manager.user_manager.get_user_by_username(username)
        
        # Check if the user exists
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Return the user's profile data
        return jsonify({
            "username": user["username"],
            "role": user["role"],
            "email": user["email"],
            "currency_preference": user["currency_preference"],
            "theme_preference": user["theme_preference"],
            "created_at": user["created_at"],
            "updated_at": user["updated_at"]
        }), 200
    except Exception as e:
        print(f"Error retrieving user '{username}': {e}")
        return jsonify({"error": "Unable to retrieve user"}), 500

# Stocks routes
@app.route("/api/stocks", methods=["GET"])
@token_required
def get_stocks():
    try:
        # Fetch unique ticker symbol with their most recent open and close prices and timestamp
        stocks_data = db_manager.stock_manager.get_recent_stock_prices()

        # Return the stocks data in JSON format
        return jsonify(stocks_data), 200
    except Exception as e:
        print(f"Error retrieving stock data: {e}")
        return jsonify({"error": "Unable to retrieve stock data"}), 500

@app.route("/api/stocks/<string:ticker_symbol>", methods=["GET"])
@token_required
def get_stock_by_ticker(ticker_symbol):
    try:
        # Fetch stock data for the given ticker symbol
        stock_data = db_manager.stock_manager.get_stock_data_by_ticker(ticker_symbol)

        if stock_data is None:
            return (
                jsonify(
                    {"error": f"No data found for ticker symbol '{ticker_symbol}'"}
                ),
                404,
            )

        # Return the stock data in JSON format
        return jsonify(stock_data), 200
    except Exception as e:
        print(f"Error retrieving stock data for ticker symbol '{ticker_symbol}': {e}")
        return jsonify({"error": "Unable to retrieve stock data"}), 500

# Api Keys Routes
@app.route("/api/keys", methods=["GET"])
@token_required
def get_api_keys():
    try:
        # Use the DBManager instance to retrieve all API keys
        api_keys_list = db_manager.api_key_manager.select_all_api_keys()

        # Return the API keys in JSON Format
        return jsonify(api_keys_list)
    except Exception as e:
        print(f"Error retrieving API keys: {e}")

        return jsonify({"error": "Unable to retrieve API keys"}), 500

@app.route("/api/keys/<string:service>", methods=["PUT"])
@token_required
def update_api_key(service):
    try:
        # Get the updated API Key from the request body
        data = request.get_json()
        updated_service = service
        updated_api_key = data.get("api_key")

        if not updated_api_key:
            return jsonify({"error": "API key is required"}), 400

        # Use the DBmanager instance to update the API key
        db_manager.api_key_manager.insert_api_key(updated_service, updated_api_key)

        # Return a success message
        return jsonify({"message": "API Key updated successfully"}), 200

    except Exception as e:
        print(f"Error updating API key: {e}")
        return jsonify({"error": "Unable to update API key"}), 500

@app.route("/api/keys/<string:service>", methods=["DELETE"])
@token_required
def delete_api_key(service):
    try:
        db_manager.api_key_manager.delete_api_key(service)
        return (
            jsonify({"message": f"API key for {service} deleted succcessfully."}),
            200,
        )
    except Exception as e:
        print(f"Error deleting API key for service {service}: {e}")
        return jsonify({"error": "Unable to delete API key"}), 500

@app.route("/api/keys", methods=["POST"])
@token_required
def add_api_key():
    data = request.get_json()
    service = data.get("service")
    api_key = data.get("api_key")

    if not service or not api_key:
        return jsonify({"error": "Service and API key are required"}), 400

    # Insert the API key into the database
    db_manager.api_key_manager.insert_api_key(service, api_key)
    return jsonify({"message": "API key added successfully"}), 201

# Jobs related routes
@app.route("/api/jobs", methods=["DELETE"])
@token_required
def delete_jobs():
    try:
        # Get job_name and scheduled_start_time from the request body
        data = request.get_json()
        job_name = data.get("job_name")
        scheduled_start_time = data.get("scheduled_start_time")

        if not job_name or not scheduled_start_time:
            return (
                jsonify(
                    {"error": "Both job_name and scheduled_start_time are required"}
                ),
                400,
            )

        # Use the DBmanager instance to delete the job by name and start time
        db_manager.job_manager.delete_job(job_name, scheduled_start_time)
        return (
            jsonify(
                {
                    "message": f"Job '{job_name}' scheduled to start at '{scheduled_start_time}' deleted successfully."
                }
            ),
            200,
        )

    except Exception as e:
        print(
            f"Error deleting job '{job_name}' scheduled at '{scheduled_start_time}': {e}"
        )
        return jsonify({"error": "Unable to delete job"}), 500

@app.route("/api/jobs", methods=["GET"])
@token_required
def get_jobs():
    try:
        # Fetch all jobs from the database
        jobs_data = db_manager.job_manager.select_all_jobs()
        return jsonify(jobs_data), 200

    except Exception as e:
        print(f"Error retrieving jobs: {e}")
        return jsonify({"error": "Unable to retrieve jobs"}), 500

@app.route("/api/jobs", methods=["POST"])
@token_required
def fetch_data_job():
    try:
        # Get start_date and end_date from the request body
        data = request.get_json()
        start_date = data.get("startDate")
        # start_date = start_date.split("T")[0]
        end_date = data.get("endDate")
        # end_date = end_date.split("T")[0]

        if not start_date or not end_date:
            return jsonify({"error": "Both start_date and end_date are required"}), 400

        # Call fetch_data_for_date_range with the specified dates
        polygon_fetcher.fetch_data_for_date_range(start_date, end_date)

        return (
            jsonify(
                {"message": "Data fetched successfully for the specified date range"}
            ),
            200,
        )

    except Exception as e:
        print(f"Error fetching data for date range {start_date} - {end_date}: {e}")
        return (
            jsonify({"error": "Unable to fetch data for the specified date range"}),
            500,
        )

@app.route("/api/jobs/2yr", methods=["GET"])
@token_required
def fetch_data_job_2yr():
    try:
        # Use polygon_fetcher to call the fetch_previous_two_years function.
        polygon_fetcher.fetch_previous_two_years()

        return jsonify({"message": "Job added successfully"}), 200
    except Exception as e:
        print(f"Error retrieving two-year jobs data: {e}")
        return (
            jsonify({"error": "Unable to retrieve jobs data for the last two years"}),
            500,
        )

if __name__ == "__main__":
    app.run(debug=True)
