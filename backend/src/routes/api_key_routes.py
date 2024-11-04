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

# API Keys Routes
@api_key_bp.route('/api/keys', methods=['GET'])
@token_required
def get_api_keys():
    try:
        api_keys_list = db_manager.api_key_manager.select_all_api_keys()
        return jsonify(api_keys_list)
    except Exception as e:
        print(f"Error retrieving API keys: {e}")
        return jsonify({"error": "Unable to retrieve API keys"}), 500
    
@api_key_bp.route('/api/keys/<string:service>', methods=['PUT'])
@token_required
def update_api_key(service):
    data = request.get_json()
    update_api_key = data.get('api_key')
    if not update_api_key:
        return jsonify({"error": "API key is required"}), 400
    
    try:
        db_manager.api_key_manager.insert_api_key(service, update_api_key)
        return jsonify({"message": "API Key updated successfully"}), 200
    except Exception as e:
        print(f"Error updating API key: {e}")
        return jsonify({"error": "Unable to update API key"}), 500
    
@api_key_bp.route('/api/keys/<string:service>', methods=['DELETE'])
@token_required
def delete_api_key(service):
    try:
        db_manager.api_key_manager.delete_api_key(service)
        return jsonify({"message": f"API key for {service} deleted successfully."}), 200
    except Exception as e:
        print(f"Error deleting API key for service {service}: {e}")
        return jsonify({"error": "Unable to delete API key"}), 500
    
@api_key_bp.route("/api/keys", methods=["POST"])
@token_required
def add_api_key():
    data = request.get_json()
    service = data.get("service")
    api_key = data.get("api_key")
    if not service or not api_key:
        return jsonify({"error": "Service and API key are required"}), 400

    try:
        db_manager.api_key_manager.insert_api_key(service, api_key)
        return jsonify({"message": "API key added successfully"}), 201
    except Exception as e:
        print(f"Error adding API key: {e}")
        return jsonify({"error": "Unable to add API key"}), 500