# routes/jobs_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..db_manager import DBManager
from ..data_ingest.polygon_stock_fetcher import PolygonStockFetcher
import jwt
from datetime import datetime, timezone
from  functools import wraps
from ..scheduler import Scheduler
import pytz
import logging 
logger = logging.getLogger(__name__)

# Initialize blueprint
jobs_bp = Blueprint("jobs", __name__)

# Initialize db_manager and polygon_fetcher
db_manager = DBManager()
polygon_fetcher = PolygonStockFetcher()
scheduler = Scheduler()


def validate_datetime(date_str):
    try:
        # Attempt to parse the input string as a date with the format "YYYY-MM-DD"
        return datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        # Return None if parsing fails due to an invalid date format or a None input
        return None
def validate_datetime_sec(date_str):
    try:
        # Attempt to parse the input string as a datetime with the format "YYYY-MM-DD HH:MM:SS"
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        # Return None if parsing fails due to an invalid date format or a None input
        return None
    
# Token protection decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Retrieve the 'Authorization' token from request headers
        token = request.headers.get('Authorization')
        
        # If no token is provided, return a 403 Forbidden error
        if not token:
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            # If the token has a 'Bearer ' prefix, remove it
            if token.startswith('Bearer '):
                token = token.split(" ")[1]
            
            # Decode the JWT token using the configured secret key
            decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Attach the decoded token data to the request context (for access in the route function)
            request.user = decoded_token
            
        # Handle cases where the token has expired
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token is expired'}), 401
        
        # Handle cases where the token is invalid (e.g., incorrect signature)
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid Token'}), 403
        
        # If token is valid, proceed with the original function
        return f(*args, **kwargs)
    return decorated

@jobs_bp.route("/api/jobs_schedule", methods=["POST"])
@token_required
def schedule_job():
    try:
        # Extract JSON data from the request
        data = request.get_json()

        # Retrieve job scheduling details from JSON data
        job_type = data.get("jobType")
        service = data.get("service")
        owner = data.get("owner")
        frequency = data.get("frequency")
        data_fetch_start_date = validate_datetime(data.get("dataFetchStartDate"))
        data_fetch_end_date = validate_datetime(data.get("dataFetchEndDate"))
        interval_days = data.get("interval")
        weekdays = data.get("selectedDaysJSON")
        timezone_str = data.get("currentTimezone")
        
        if isinstance(interval_days, str):
                interval_days = int(interval_days) if interval_days.isdigit() else None
        
        # Combine date and time for start and end if both are provided
        scheduled_start_str = (
            datetime.strptime(f"{data['scheduledStartDate']} {data['scheduledStartTime']}", "%Y-%m-%d %H:%M")
            .strftime("%Y-%m-%d %H:%M:%S") if data.get("scheduledStartDate") and data.get("scheduledStartTime") else None
        )
        
        scheduled_end_str = (
            datetime.strptime(f"{data['scheduledEndDate']} {data['scheduledEndTime']}", "%Y-%m-%d %H:%M")
            .strftime("%Y-%m-%d %H:%M:%S") if data.get("scheduledEndDate") and data.get("scheduledEndTime") else None
        )
        
        # Parse timezone
        local_tz = pytz.timezone(timezone_str)
        
        # Validate date formats with seconds precision for database compatibility
        scheduled_start_local = validate_datetime_sec(scheduled_start_str) if scheduled_start_str else None
        scheduled_end_local = validate_datetime_sec(scheduled_end_str) if scheduled_end_str else None
        
        # Convert scheduled_start_str and scheduled_end_str to UTC if they exist
        if scheduled_start_local:
            scheduled_start_utc = local_tz.localize(scheduled_start_local).astimezone(timezone.utc)
        else:
            scheduled_start_utc = None
            
        if scheduled_end_local:
            scheduled_end_utc = local_tz.localize(scheduled_end_local).astimezone(timezone.utc)
        else:
            scheduled_end_utc = None
        
        # Insert job schedule into the database using the Job Manager
        jobs_schedule_data = db_manager.job_manager.insert_job_schedule(
            job_type, service, owner, frequency, scheduled_start_utc,
            scheduled_end_utc, data_fetch_start_date, data_fetch_end_date,
            interval_days, weekdays
        )
        #scheduler.start_scheduler()
        scheduler.schedule_existing_jobs()
        
        # Return success response with the inserted job schedule data
        return jsonify(jobs_schedule_data), 200
    except Exception as e:
        # Print error to server logs and return an error response to the client
        logger.error(f"Error inserting Job Schedules: {e}")
        return jsonify({"error": "Unable to retrieve Job Schedules"}), 500

@jobs_bp.route("/api/jobs_schedule", methods=["GET"])
@token_required
def get_jobs_schedule():
    try:
        # Fetch job schedules from the database
        jobs_schedule_data = db_manager.job_manager.select_all_job_schedules()
        
        # Check if data is retrieved
        if not jobs_schedule_data:
            return jsonify({"message": "No job schedules found"}), 404
        
        # Return the job schedules data as JSON
        return jsonify(jobs_schedule_data), 200
    except Exception as e:
        # Print error to server logs and return an error response to the client
        logger.error(f"Error retrieving Job Schedules: {e}")
        return jsonify({"error": "Unable to retrieve Job Schedules"}), 500
    
@jobs_bp.route("/api/jobs_schedule/check_job", methods=["POST"])
@token_required
def check_job_schedule_exists():
    try:
        # Extract JSON data from the request
        data = request.get_json()
        job_type = data.get("jobType")
        service = data.get("service")
        frequency = data.get("frequency")
        scheduled_start_date = data.get("scheduledStartDate")
        
        # Query the database to check if a matching job schedule exists
        exists = db_manager.job_manager.select_job_schedule(
            job_type, service, frequency, scheduled_start_date
        )

        # Return the result as JSON
        return jsonify({"exists": exists}), 200
    except Exception as e:
        logger.error(f"Error checking Job Schedule: {e}")
        return jsonify({"error": "Unable to check job schedule"}), 500
    
@jobs_bp.route("/api/jobs_schedule", methods=["DELETE"])
@token_required
def delete_job_schedule():
    try:
        # Extract JSON data from the request
        data = request.get_json()
        
        # Extract required parameters
        job_type = data.get("job_type")
        service = data.get("service")
        frequency = data.get("frequency")
        scheduled_start_date = data.get("scheduled_start_date")
        
        # Validate required parameters
        if not all([job_type, service, frequency, scheduled_start_date]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        # Delete the job schedule from the database
        db_manager.job_manager.delete_job_schedule(job_type, service, frequency, scheduled_start_date)
        
        # Return the result as JSON
        return jsonify({"message": f"Successfully deleted job schedule for {job_type} {service}"}), 200
    except Exception as e:
        logger.error(f"Error deleting Job Schedule: {e}")
        return jsonify({"error": "Unable to delete job schedule"}), 500