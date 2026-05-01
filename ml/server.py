from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load model
model = joblib.load("risk_model.pkl")

# Test route
@app.route("/", methods=["GET"])
def home():
    return "ML Server Running"

# Prediction route
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        df = pd.DataFrame(data)

        predictions = model.predict(df)

        return jsonify({
            "ml_scores": predictions.tolist()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# IMPORTANT FOR RENDER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)