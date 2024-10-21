from flask import Flask, jsonify, request
from flask_cors import CORS
import db_manager as db
import stock_data_fetcher as sf

app = Flask(__name__)
CORS(app)

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
    api_key_file = 'api_key.txt'
    api_key = load_api_key(api_key_file)
    database_connect = db.DBManager()
    database_connect.insert_api_key('Polygon.io', api_key)
    db_api_key = database_connect.select_api_key('Polygon.io')
    stock_fetcher = sf.PolygonStockFetcher(db_api_key)
    date = '2024-10-18'
    data = stock_fetcher.get_stock_data(date)
    stock_fetcher.load_stock_data(data)