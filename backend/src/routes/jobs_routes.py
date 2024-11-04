from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
from ..data_ingest.polygon_stock_fetcher import PolygonStockFetcher
import jwt
from  functools import wraps

# Initialize blueprint
jobs_bp = Blueprint("jobs", __name__)

# Initialize db_manager and polygon_fetcher
db_manager = DBManager()
polygon_fetcher = PolygonStockFetcher()

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

@jobs_bp.route("/api/jobs", methods=["DELETE"])
@token_required
def delete_jobs():
    try:
        data = request.get_json()
        job_name = data.get("job_name")
        scheduled_start_time = data.get("scheduled_start_time")

        if not job_name or not scheduled_start_time:
            return jsonify({"error": "Both job_name and scheduled_start_time are required"}), 400

        db_manager.job_manager.delete_job(job_name, scheduled_start_time)
        return jsonify({"message": f"Job '{job_name}' scheduled to start at '{scheduled_start_time}' deleted successfully."}), 200

    except Exception as e:
        print(f"Error deleting job '{job_name}' scheduled at '{scheduled_start_time}': {e}")
        return jsonify({"error": "Unable to delete job"}), 500

@jobs_bp.route("/api/jobs", methods=["GET"])
@token_required
def get_jobs():
    try:
        jobs_data = db_manager.job_manager.select_all_jobs()
        return jsonify(jobs_data), 200

    except Exception as e:
        print(f"Error retrieving jobs: {e}")
        return jsonify({"error": "Unable to retrieve jobs"}), 500

@jobs_bp.route("/api/jobs", methods=["POST"])
@token_required
def fetch_data_job():
    try:
        data = request.get_json()
        start_date = data.get("startDate")
        end_date = data.get("endDate")

        if not start_date or not end_date:
            return jsonify({"error": "Both start_date and end_date are required"}), 400

        polygon_fetcher.fetch_data_for_date_range(start_date, end_date)
        return jsonify({"message": "Data fetched successfully for the specified date range"}), 200

    except Exception as e:
        print(f"Error fetching data for date range {start_date} - {end_date}: {e}")
        return jsonify({"error": "Unable to fetch data for the specified date range"}), 500

@jobs_bp.route("/api/jobs/2yr", methods=["GET"])
@token_required
def fetch_data_job_2yr():
    try:
        polygon_fetcher.fetch_previous_two_years()
        return jsonify({"message": "Job added successfully"}), 200

    except Exception as e:
        print(f"Error retrieving two-year jobs data: {e}")
        return jsonify({"error": "Unable to retrieve jobs data for the last two years"}), 500