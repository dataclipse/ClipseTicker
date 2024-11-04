# routes/user_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
import jwt
from  functools import wraps

# Initialize Blueprint
user_bp = Blueprint("user_bp", __name__)

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

# Update user route
@user_bp.route('/api/user', methods=['PUT'])
@token_required
def update_user():
    data = request.get_json()
    username = data.get('username')
    new_username = data.get('new_username')
    new_password = data.get('new_password')
    new_email = data.get('new_email')
    new_currency = data.get('new_currency')
    new_theme = data.get('new_theme')
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    try:
        result = db_manager.user_manager.update_user(
            username,
            new_username=new_username,
            new_password=new_password,
            new_email=new_email,
            new_currency=new_currency,
            new_theme=new_theme
        )
        
        if isinstance(result, str):
            return jsonify({'error': result}), 400
        
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        print(f"Error updating user '{username}': {e}")
        return jsonify({'error': 'Unable to update user'}), 500
    
# Get user by username route
@user_bp.route('/api/user/<string:username>', methods=['GET'])
@token_required
def get_user_by_username(username):
    try:
        user = db_manager.user_manager.get_user_by_username(username)

        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        print(f"Error getting user '{username}': {e}")
        return jsonify({'error': 'Unable to get user'}), 500
    