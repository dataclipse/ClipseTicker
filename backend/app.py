from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/data', methods =['GET'])
def get_data():
    data = {
        'message': 'Hello from Flask!',
        'items': [1, 2, 3, 4, 5]
    }

    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)