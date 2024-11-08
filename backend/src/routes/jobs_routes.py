from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
from ..data_ingest.polygon_stock_fetcher import PolygonStockFetcher
import jwt
from datetime import datetime
from  functools import wraps

# Initialize blueprint
jobs_bp = Blueprint("jobs", __name__)

# Initialize db_manager and polygon_fetcher
db_manager = DBManager()
polygon_fetcher = PolygonStockFetcher()

def validate_datetime(date_str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        # Return None if parsing fails
        return None
    
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

@jobs_bp.route("/api/jobs_schedule", methods=["POST"])
@token_required
def schedule_job():
    try:
        data = request.get_json()
        job_type = data.get("job_type")
        service = data.get("service")
        owner = data.get("owner")
        frequency = data.get("frequency")
        data_fetch_start_date = data.get("data_fetch_start_date")
        data_fetch_end_date = data.get("data_fetch_end_date")
        scheduled_start_date = data.get("scheduled_start_date")
        scheduled_end_date = data.get("scheduled_end_date")
        scheduled_start_time = data.get("scheduled_start_time")
        scheduled_end_time = data.get("scheduled_end_time")
        interval_days = data.get("interval")
        weekdays = data.get("weekdays")
        
        # Parse and combine into a datetime object
        scheduled_start_datetime = None
        scheduled_end_datetime = None
        if scheduled_start_date and scheduled_start_time:
            scheduled_start_datetime = datetime.strptime(f"{scheduled_start_date} {scheduled_start_time}", "%Y-%m-%d %H:%M" )
        
        if scheduled_end_date and scheduled_end_time:
            scheduled_end_datetime = datetime.strptime(f"{scheduled_end_date} {scheduled_end_time}", "%Y-%m-%d %H:%M" )
        
        # Convert datetime objects to string for storage
        scheduled_start_str = None
        scheduled_end_str = None
        
        if scheduled_start_datetime:
            scheduled_start_str = scheduled_start_datetime.strftime("%Y-%m-%d %H:%M:%S")
        if scheduled_end_datetime:
            scheduled_end_str = scheduled_end_datetime.strftime("%Y-%m-%d %H:%M:%S")
        if (interval_days == ''):
            interval_days = None
        
        data_fetch_start_date = validate_datetime(data_fetch_start_date)
        data_fetch_end_date = validate_datetime(data_fetch_end_date)
        
        print(f'Data Fetch Start: {data_fetch_start_date}')
        print(f'Data Fetch End: {data_fetch_end_date}')
        
        print(f'Scheduled Start: {scheduled_start_str}')
        print(f'Scheduled End: {scheduled_end_str}')
        
        print(f'Interval: {interval_days}')
        print(f'Weekdays: {weekdays}')
        
        
        jobs_schedule_data = db_manager.job_manager.insert_job_schedule(
            job_type,
            service,
            owner,
            frequency,
            scheduled_start_str,
            scheduled_end_str,
            data_fetch_start_date,
            data_fetch_end_date,
            interval_days,
            weekdays
        )
        
        return jsonify(jobs_schedule_data), 200
    except Exception as e:
        print(f"Error inserting Job Schedules: {e}")
        return jsonify({"error": "Unable to retrieve Job Schedules"}), 500

@jobs_bp.route("/api/jobs/2yr", methods=["GET"])
@token_required
def fetch_data_job_2yr():
    try:
        polygon_fetcher.fetch_previous_two_years()
        return jsonify({"message": "Job added successfully"}), 200

    except Exception as e:
        print(f"Error retrieving two-year jobs data: {e}")
        return jsonify({"error": "Unable to retrieve jobs data for the last two years"}), 500