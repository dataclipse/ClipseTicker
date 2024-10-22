from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, MetaData, Table, select
from sqlalchemy.orm import sessionmaker
from db_manager import DBManager
from stock_data_fetcher import PolygonStockFetcher

app = Flask(__name__)
CORS(app, resources={r"/*":{"origins": "*"}})

db_manager = DBManager()

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

    

@app.route('/api/data', methods =['GET'])
def get_data():
    data = {
        'message': 'Hello from Flask!',
        'items': [1, 2, 3, 4, 5]
    }

    return jsonify(data)

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
    #app.run(debug=True)
    api_key_file = 'api_key.txt'
    api_key = load_api_key(api_key_file)
    #database_connect = db.DBManager()
    #database_connect.insert_api_key('Polygon.io', api_key)
    #db_api_key = database_connect.select_api_key('Polygon.io')

    polygon_fetcher = PolygonStockFetcher(api_key=api_key)
    start_date = "2024-10-14"
    end_date = "2024-10-21"

    polygon_fetcher.fetch_data_for_date_range(start_date, end_date)
