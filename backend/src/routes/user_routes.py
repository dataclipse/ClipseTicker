# routes/user_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
import jwt
from  functools import wraps
import logging

# Initialize Blueprint
user_bp = Blueprint("user_bp", __name__)

# Initialize db_manager
db_manager = DBManager()

# Token protection decorator
def token_required(f):
    # Decorator to protect routes by requiring a valid JWT token in the request headers
    @wraps(f) # Preserve the metadata of the original function
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
                token = token.split(" ")[1] # Extract the actual token string
                
            # Decode the token using the app's secret key and specify the algorithm
            decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Attach the decoded token data to the request object for access in the protected route
            request.user = decoded_token
        except jwt.ExpiredSignatureError:
            # Handle the error if the token has expired
            return jsonify({'error': 'Token is expired'}), 401
        except jwt.InvalidTokenError:
            # Handle the error if the token is invalid
            return jsonify({'error': 'Invalid Token'}), 403
        
        # Call the original route function if the token is valid
        return f(*args, **kwargs)
    
    # Return the decorated function with token validation applied
    return decorated

# Update user route
@user_bp.route('/api/user', methods=['PUT'])
@token_required
def update_user():
    # Update user information with optional new values for username, password, email, currency, and theme
    data = request.get_json()
    username = data.get('username')
    new_username = data.get('new_username')
    new_password = data.get('new_password')
    new_email = data.get('new_email')
    new_currency = data.get('new_currency')
    new_theme = data.get('new_theme')
    
    # Check if the current username is provided
    if not username:
        # Return a 400 error if the current username is missing
        return jsonify({'error': 'Username is required'}), 400
    
    try:
        # Attempt to update the user with the new values, calling update_user from user_manager
        result = db_manager.user_manager.update_user(
            username,
            new_username=new_username,
            new_password=new_password,
            new_email=new_email,
            new_currency=new_currency,
            new_theme=new_theme
        )
        
        # Check if the result is an error message (e.g., username already exists)
        if isinstance(result, str):
            # Return a 400 error with the specific message if the update fails
            return jsonify({'error': result}), 400
        
        # Return a success message if the user update was successful
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        # Log any error that occurs during the update process
        print(f"Error updating user '{username}': {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({'error': 'Unable to update user'}), 500
    
# Get user by username route
@user_bp.route('/api/user/<string:username>', methods=['GET'])
@token_required
def get_user_by_username(username):
    # Retrieve and return user information for a specific username
    try:
        # Call the user manager to fetch user data for the given username
        user = db_manager.user_manager.get_user_by_username(username)

        # Check if the user data exists
        if not user:
            # Return a 404 error if no user was found
            return jsonify({'error': 'User not found'}), 404
        
        # Return user data as a JSON response with a 200 status code
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
        # Log any error that occurs during data retrieval
        print(f"Error getting user '{username}': {e}")
        
        # Return a JSON error response with a 500 status code if an exception occurs
        return jsonify({'error': 'Unable to get user'}), 500
    