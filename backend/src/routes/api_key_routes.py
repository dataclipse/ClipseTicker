# routes/api_key_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
import jwt
from  functools import wraps

# Initialize Blueprint
api_key_bp = Blueprint('api_key', __name__)

# Initialize db_manager 
db_manager = DBManager()

# Token protection decorator
def token_required(f):
    # Decorator to protect routes by requiring a valid JWT token in the request headers
    @wraps(f)
    def decorated(*args, **kwargs):
        # Retrieve the token from the 'Authorization' header in the request
        token = request.headers.get('Authorization')
        
        # Check if the token is missing
        if not token:
            return jsonify({'error': 'Token is missing!'}), 403  # Return error if token is not provided
        
        try:
            # Remove 'Bearer ' prefix if it exists in the token
            if token.startswith('Bearer '):
                token = token.split(" ")[1] # Extract the actual token string
                
            # Decode the token using the secret key and specify the algorithm
            decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Attach the decoded token data to the request object for use in the protected route
            request.user = decoded_token
        except jwt.ExpiredSignatureError:
            # Handle the error if the token has expired
            return jsonify({'error': 'Token is expired'}), 401
        except jwt.InvalidTokenError:
            # Handle the error if the token is invalid
            return jsonify({'error': 'Invalid Token'}), 403
        
        # Call the original route function if the token is valid
        return f(*args, **kwargs)
    
    # Return the decorated function
    return decorated

# API Keys Routes
@api_key_bp.route('/api/keys', methods=['GET'])
@token_required
def get_api_keys():
    # Route to retrieve all API keys; requires a valid JWT token for access
    try:
        # Fetch all API keys by calling the select_all_api_keys method from db_manager's api_key_manager
        api_keys_list = db_manager.api_key_manager.select_all_api_keys()
        
        # Return the list of API keys as a JSON response
        return jsonify(api_keys_list)
    except Exception as e:
        # Log any error that occurs during the retrieval process
        print(f"Error retrieving API keys: {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": "Unable to retrieve API keys"}), 500

@api_key_bp.route('/api/keys/<string:service>', methods=['PUT'])
@token_required
def update_api_key(service):
    # Update or insert an API key for a specified service
    data = request.get_json() # Retrieve JSON data from the request body
    update_api_key = data.get('api_key') # Extract the 'api_key' value from the JSON data
    
    # Check if 'api_key' was provided in the request
    if not update_api_key:
        # Return a 400 error if 'api_key' is missing
        return jsonify({"error": "API key is required"}), 400
    
    try:
        # Call the database manager to insert or update the API key for the given service
        db_manager.api_key_manager.insert_api_key(service, update_api_key)
        
        # Return a success message if the API key was updated successfully
        return jsonify({"message": "API Key updated successfully"}), 200
    except Exception as e:
        # Log any error that occurs during the update process
        print(f"Error updating API key: {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": "Unable to update API key"}), 500
    
@api_key_bp.route('/api/keys/<string:service>', methods=['DELETE'])
@token_required
def delete_api_key(service):
    # Delete an API key for a specified service
    try:
        # Call the database manager to delete the API key associated with the given service
        db_manager.api_key_manager.delete_api_key(service)
        
        # Return a success message if the API key was deleted successfully
        return jsonify({"message": f"API key for {service} deleted successfully."}), 200
    except Exception as e:
        # Log any error that occurs during the deletion process
        print(f"Error deleting API key for service {service}: {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": "Unable to delete API key"}), 500
    
@api_key_bp.route("/api/keys", methods=["POST"])
@token_required
def add_api_key():
    # Add a new API key for a specified service
    data = request.get_json() # Retrieve JSON data from the request body
    service = data.get("service") # Extract the 'service' value from the JSON data
    api_key = data.get("api_key") # Extract the 'api_key' value from the JSON data
    
    # Check if both 'service' and 'api_key' are provided
    if not service or not api_key:
        # Return a 400 error if either 'service' or 'api_key' is missing
        return jsonify({"error": "Service and API key are required"}), 400

    try:
        # Call the database manager to insert the new API key for the specified service
        db_manager.api_key_manager.insert_api_key(service, api_key)
        
        # Return a success message with a 201 status code indicating the API key was added
        return jsonify({"message": "API key added successfully"}), 201
    except Exception as e:
        # Log any error that occurs during the addition process
        print(f"Error adding API key: {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({"error": "Unable to add API key"}), 500