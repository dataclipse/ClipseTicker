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

@jobs_bp.route("/api/jobs", methods=["DELETE"])
@token_required
def delete_jobs():
    try:
        # Extract JSON data from the request
        data = request.get_json()
        
        # Retrieve job name and scheduled start time from request data
        job_name = data.get("job_name")
        scheduled_start_time = data.get("scheduled_start_time")

        # Validate that both job name and scheduled start time are provided
        if not job_name or not scheduled_start_time:
            return jsonify({"error": "Both job_name and scheduled_start_time are required"}), 400

        # Attempt to delete the specified job from the database using the Job Manager
        db_manager.job_manager.delete_job(job_name, scheduled_start_time)
        
        # Return success message if the job was deleted successfully
        return jsonify({"message": f"Job '{job_name}' scheduled to start at '{scheduled_start_time}' deleted successfully."}), 200

    except Exception as e:
        print(f"Error deleting job '{job_name}' scheduled at '{scheduled_start_time}': {e}")
        return jsonify({"error": "Unable to delete job"}), 500

@jobs_bp.route("/api/jobs", methods=["GET"])
@token_required
def get_jobs():
    try:
        # Retrieve all job records using the Job Manager
        jobs_data = db_manager.job_manager.select_all_jobs()
        
        # Return the job data as JSON with a 200 OK status
        return jsonify(jobs_data), 200

    except Exception as e:
        # Log any exception details to the console and return a 500 error response
        print(f"Error retrieving jobs: {e}")
        return jsonify({"error": "Unable to retrieve jobs"}), 500

@jobs_bp.route("/api/jobs", methods=["POST"])
@token_required
def fetch_data_job():
    try:
        # Extract JSON data from the request
        data = request.get_json()
        
        # Retrieve start and end dates from the request data
        start_date = data.get("startDate")
        end_date = data.get("endDate")

        # Validate presence of both start and end dates
        if not start_date or not end_date:
            return jsonify({"error": "Both start_date and end_date are required"}), 400

        # Fetch data from polygon_io for the specified date range
        polygon_fetcher.fetch_data_for_date_range(start_date, end_date)
        
        # Return success message on successful data fetch
        return jsonify({"message": "Data fetched successfully for the specified date range"}), 200

    except Exception as e:
        # Log error details to server logs and return an error response to the client
        print(f"Error fetching data for date range {start_date} - {end_date}: {e}")
        return jsonify({"error": "Unable to fetch data for the specified date range"}), 500

@jobs_bp.route("/api/jobs_schedule", methods=["POST"])
@token_required
def schedule_job():
    try:
        # Extract JSON data from the request
        data = request.get_json()
        print(data)  # Debugging line to print the received data
        # Retrieve job scheduling details from JSON data
        job_type = data.get("jobType")
        service = data.get("service")
        owner = data.get("owner")
        frequency = data.get("frequency")
        data_fetch_start_date = validate_datetime(data.get("dataFetchStartDate"))
        data_fetch_end_date = validate_datetime(data.get("dataFetchEndDate"))
        interval_days = data.get("interval")
        weekdays = data.get("selectedDaysJSON")
        
        # Combine date and time for start and end if both are provided
        scheduled_start_str = (
            datetime.strptime(f"{data['scheduledStartDate']} {data['scheduledStartTime']}", "%Y-%m-%d %H:%M")
            .strftime("%Y-%m-%d %H:%M:%S") if data.get("scheduledStartDate") and data.get("scheduledStartTime") else None
        )
        
        scheduled_end_str = (
            datetime.strptime(f"{data['scheduledEndDate']} {data['scheduledEndTime']}", "%Y-%m-%d %H:%M")
            .strftime("%Y-%m-%d %H:%M:%S") if data.get("scheduledEndDate") and data.get("scheduledEndTime") else None
        )
        
        # Validate date formats with seconds precision for database compatibility
        scheduled_start_str = validate_datetime_sec(scheduled_start_str) if scheduled_start_str else None
        scheduled_end_str = validate_datetime_sec(scheduled_end_str) if scheduled_end_str else None
        
        # Insert job schedule into the database using the Job Manager
        jobs_schedule_data = db_manager.job_manager.insert_job_schedule(
            job_type, service, owner, frequency, scheduled_start_str,
            scheduled_end_str, data_fetch_start_date, data_fetch_end_date,
            interval_days, weekdays
        )
        
        # Return success response with the inserted job schedule data
        return jsonify(jobs_schedule_data), 200
    except Exception as e:
        # Print error to server logs and return an error response to the client
        print(f"Error inserting Job Schedules: {e}")
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
        print(f"Error retrieving Job Schedules: {e}")
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
        print(f"Error checking Job Schedule: {e}")
        return jsonify({"error": "Unable to check job schedule"}), 500
    
@jobs_bp.route("/api/jobs/2yr", methods=["GET"])
@token_required
def fetch_data_job_2yr():
    try:
        # Fetch data for the previous two years from polygon_io
        polygon_fetcher.fetch_previous_two_years()
        
        # Return success message upon successful data retrieval
        return jsonify({"message": "Job added successfully"}), 200

    except Exception as e:
        # Log the error to the console and return a 500 error response to the client
        print(f"Error retrieving two-year jobs data: {e}")
        return jsonify({"error": "Unable to retrieve jobs data for the last two years"}), 500