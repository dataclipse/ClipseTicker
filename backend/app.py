from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, MetaData, Table, select
from sqlalchemy.orm import sessionmaker
from db_manager import DBManager
from stock_data_fetcher import PolygonStockFetcher
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*":{"origins": "*"}})

db_manager = DBManager()
polygon_fetcher = PolygonStockFetcher()

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    try:
        # Fetch unique ticker symbol with their most recent open and close prices and timestamp
        stocks_data = db_manager.get_recent_stock_prices()

        # Return the stocks data in JSON format
        return jsonify(stocks_data), 200
    except Exception as e:
        print(f"Error retrieving stock data: {e}")
        return jsonify({"error": "Unable to retrieve stock data"}), 500

@app.route('/api/keys', methods=['GET'])
def get_api_keys():
    try:
        # Use the DBManager instance to retrieve all API keys
        api_keys_list = db_manager.select_all_api_keys()
        
        # Return the API keys in JSON Format
        return jsonify(api_keys_list)
    except Exception as e:
        print(f"Error retrieving API keys: {e}")

        return jsonify({"error": "Unable to retrieve API keys"}), 500

@app.route('/api/keys/<string:service>', methods=['PUT'])
def update_api_key(service):
    try:
        # Get the updated API Key from the request body
        data = request.get_json()
        updated_service = service
        updated_api_key = data.get('api_key')

        if not updated_api_key:
            return jsonify({"error": "API key is required"}), 400
        
        # Use the DBmanager instance to update the API key
        db_manager.insert_api_key(updated_service, updated_api_key)

        # Return a success message
        return jsonify({"message": "API Key updated successfully"}), 200
    
    except Exception as e:
        print(f"Error updating API key: {e}")
        return jsonify({"error": "Unable to update API key"}), 500

@app.route('/api/keys/<string:service>', methods=['DELETE'])
def delete_api_key(service):
    try:
        db_manager.delete_api_key(service)
        return jsonify({"message": f"API key for {service} deleted succcessfully."}), 200
    except Exception as e:
        print(f"Error deleting API key for service {service}: {e}")
        return jsonify({"error": "Unable to delete API key"}), 500
    
@app.route('/api/keys', methods=['POST'])
def add_api_key():
    data = request.get_json()
    service = data.get('service')
    api_key = data.get('api_key')

    if not service or not api_key:
        return jsonify({'error': 'Service and API key are required'}), 400
    
    # Insert the API key into the database
    db_manager.insert_api_key(service, api_key)
    return jsonify({'message': 'API key added successfully'}), 201

@app.route('/api/jobs', methods=['DELETE'])
def delete_jobs():
    try:
        # Get job_name and scheduled_start_time from the request body
        data = request.get_json()
        job_name = data.get('job_name')
        scheduled_start_time = data.get('scheduled_start_time')

        if not job_name or not scheduled_start_time:
            return jsonify({"error": "Both job_name and scheduled_start_time are required"}), 400
        
        # Use the DBmanager instance to delete the job by name and start time
        db_manager.delete_job(job_name, scheduled_start_time)
        return jsonify({"message": f"Job '{job_name}' scheduled to start at '{scheduled_start_time}' deleted successfully."}), 200

    except Exception as e:
        print(f"Error deleting job '{job_name}' scheduled at '{scheduled_start_time}': {e}")
        return jsonify({"error": "Unable to delete job"}), 500

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        # Fetch all jobs from the database
        jobs_data = db_manager.select_all_jobs()
        return jsonify(jobs_data), 200
    
    except Exception as e:
        print(f"Error retrieving jobs: {e}")
        return jsonify({"error": "Unable to retrieve jobs"}), 500
    
@app.route('/api/jobs', methods=['POST'])
def fetch_data_job():
    try:
        # Get start_date and end_date from the request body
        data = request.get_json()
        start_date = data.get('start_date')
        start_date = start_date.split("T")[0]
        end_date = data.get('end_date')
        end_date = end_date.split("T")[0]

        if not start_date or not end_date:
            return jsonify({"error": "Both start_date and end_date are required"}), 400
        
        # Call fetch_data_for_date_range with the specified dates
        polygon_fetcher.fetch_data_for_date_range(start_date, end_date)

        return jsonify({"message": "Data fetched successfully for the specified date range"}), 200
    
    except Exception as e:
        print(f"Error fetching data for date range {start_date} - {end_date}: {e}")
        return jsonify({"error": "Unable to fetch data for the specified date range"}), 500
    
@app.route('/api/jobs/2yr', methods=['GET'])
def fetch_data_job_2yr():
    try:
        # Use polygon_fetcher to call the fetch_previous_two_years function.
        polygon_fetcher.fetch_previous_two_years()

        return jsonify({"message": "Job added successfully"}), 200
    except Exception as e:
        print(f"Error retrieving two-year jobs data: {e}")
        return jsonify({"error": "Unable to retrieve jobs data for the last two years"}), 500

def load_api_key(file_path):
        try:
            with open(file_path, 'r') as file:
                api_key = file.read().strip()
                return api_key
        except FileNotFoundError:
            print(f"Error: The file {file_path} was not found.")
            return None
        except Exception as e:
            print(f"An error occurred while reading the API key: {e}")
            return None

if __name__ == '__main__':
    app.run(debug=True)
    #database_connect = DBManager()
    #api_key_file = 'api_key.txt'
    #api_key = load_api_key(api_key_file)
    #database_connect.insert_api_key('Polygon.io', api_key)
    #db_api_key = database_connect.select_api_key('Polygon.io')

    #start_date = '2023-10-10'
    #end_date = '2023-10-12'

    #polygon_fetcher = PolygonStockFetcher()
    #polygon_fetcher.fetch_data_for_date_range(start_date, end_date)
