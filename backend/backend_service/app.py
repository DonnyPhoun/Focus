import os
from flask import Flask, jsonify, send_from_directory
# Assuming the root of your project is one level up from backend_service
# Set the FLASK_APP environment variable to point to this file (done below)

app = Flask(__name__)

# Basic test route
@app.route('/')
def home():
    """A simple status check for the API."""
    return jsonify({
        "status": "online", 
        "service": "Lofi Transformer API",
        "message": "Ready to generate music."
    })

if __name__ == '__main__':
    # This block is typically used for local development running
    app.run(debug=True, port=5000)
