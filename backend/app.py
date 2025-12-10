"""
Neural Network Student Prediction API
Flask REST API for predicting student outcomes using TensorFlow/Keras NN models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tensorflow as tf
import numpy as np
import pandas as pd
import joblib
import traceback

app = Flask(__name__)
CORS(app)

# Model and scaler paths
model_path = os.path.join(os.path.dirname(__file__), '..', 'model')

# Global model and scaler variables
persistence_model = None
completion_model = None
gpa_2nd_model = None
scaler_main = None
feature_info = None

# Feature column names in exact order used during training
MAIN_FEATURES = [
    'First Language', 'Funding', 'School', 'Fast Track', 'Coop', 'Residency',
    'Gender', 'Prev Education', 'Age Group', 'High School Average', 'Math Score',
    'English Grade', 'First Term Gpa'
]

# Entry validation features (for /validate-entry endpoint)
ENTRY_FEATURES = [
    'High School Average', 'Math Score', 'English Grade'
]

# Custom loss functions (needed for loading models)
def weighted_binary_crossentropy(y_true, y_pred):
    """Custom loss: prevents numerical instability"""
    y_pred = tf.clip_by_value(y_pred, 1e-7, 1 - 1e-7)
    loss = -y_true * tf.math.log(y_pred) - (1 - y_true) * tf.math.log(1 - y_pred)
    return tf.reduce_mean(loss)

def smooth_mse_loss(y_true, y_pred):
    """Custom MSE loss: consistent error penalization"""
    return tf.reduce_mean(tf.square(y_true - y_pred))


def load_models():
    """Load all neural network models and scalers at startup"""
    global persistence_model, completion_model, gpa_2nd_model
    global scaler_main, feature_info
    
    try:
        print("\n" + "=" * 70)
        print("LOADING NEURAL NETWORK MODELS AND SCALERS")
        print("=" * 70)
        
        # Load persistence model (binary classification)
        try:
            persistence_model = tf.keras.models.load_model(
                os.path.join(model_path, 'persistence_model_nn.keras'),
                custom_objects={'weighted_binary_crossentropy': weighted_binary_crossentropy}
            )
        except Exception:
            persistence_model = tf.keras.models.load_model(
                os.path.join(model_path, 'persistence_model_nn.keras'),
                compile=False
            )
        print("✓ Persistence NN model loaded")
        
        # Load completion model (binary classification)
        try:
            completion_model = tf.keras.models.load_model(
                os.path.join(model_path, 'completion_model_nn.keras'),
                custom_objects={'weighted_binary_crossentropy': weighted_binary_crossentropy}
            )
        except Exception:
            completion_model = tf.keras.models.load_model(
                os.path.join(model_path, 'completion_model_nn.keras'),
                compile=False
            )
        print("✓ Completion NN model loaded")
        
        # Load 2nd term GPA model (regression)
        try:
            gpa_2nd_model = tf.keras.models.load_model(
                os.path.join(model_path, 'gpa_2nd_model_nn.keras'),
                custom_objects={'smooth_mse_loss': smooth_mse_loss}
            )
        except Exception:
            gpa_2nd_model = tf.keras.models.load_model(
                os.path.join(model_path, 'gpa_2nd_model_nn.keras'),
                compile=False
            )
        print("✓ 2nd Term GPA NN model loaded")
        
        # Load scalers
        scaler_main = joblib.load(os.path.join(model_path, 'scaler_main_features.pkl'))
        print("✓ Main feature scaler loaded (13 features)")
        
        # Load feature information
        feature_info = joblib.load(os.path.join(model_path, 'model_info_nn.pkl'))
        print("✓ Feature information loaded")
        
        print("=" * 70)
        print("✓ ALL MODELS LOADED SUCCESSFULLY")
        print("=" * 70 + "\n")
        return True
        
    except Exception as e:
        print("\n" + "=" * 70)
        print("✗ ERROR LOADING MODELS")
        print("=" * 70)
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        print("=" * 70 + "\n")
        return False


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    models_ready = all([persistence_model, completion_model, gpa_2nd_model, scaler_main])
    return jsonify({
        "status": "healthy" if models_ready else "models_not_loaded",
        "models_loaded": models_ready
    }), 200 if models_ready else 503


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict 2nd term GPA and student outcomes using full feature set (13 features).
    NOTE: 1st term GPA must be provided as input (not predicted - model had R² = -0.01).
    
    Input JSON:
    {
        "firstLanguage": 1-3,
        "funding": 1-9,
        "school": 1-7,
        "fastTrack": 1-2,
        "coop": 1-2,
        "residency": 1-2,
        "gender": 1-3,
        "prevEducation": 1-2,
        "ageGroup": 1-10,
        "highSchool": 0-100,
        "mathScore": 0-50,
        "englishGrade": 1-11,
        "firstTermGpa": 0-4.5  (INPUT: actual GPA - not predicted)
    }
    
    Returns:
    {
        "status": "success",
        "persistenceProbability": float (0-1),
        "completionProbability": float (0-1),
        "predictedSecondTermGpa": float (0-4.5),
        "providedFirstTermGpa": float (echoed from input)
    }
    """
    if not all([persistence_model, completion_model, gpa_2nd_model, scaler_main]):
        return jsonify({
            "status": "error",
            "message": "Models not loaded. Please restart the server."
        }), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400

        # Create features DataFrame with exact column order and names from training
        features_df = pd.DataFrame([[
            int(data.get("firstLanguage", 1)),
            int(data.get("funding", 1)),
            int(data.get("school", 1)),
            int(data.get("fastTrack", 1)),
            int(data.get("coop", 1)),
            int(data.get("residency", 1)),
            int(data.get("gender", 1)),
            int(data.get("prevEducation", 1)),
            int(data.get("ageGroup", 1)),
            float(data.get("highSchool", 0)),
            float(data.get("mathScore", 0)),
            int(data.get("englishGrade", 1)),
            float(data.get("firstTermGpa", 0))
        ]], columns=MAIN_FEATURES)

        # Scale features
        features_scaled = scaler_main.transform(features_df)

        # Make predictions
        persistence_pred = float(persistence_model.predict(features_scaled, verbose=0)[0][0])
        completion_pred = float(completion_model.predict(features_scaled, verbose=0)[0][0])
        gpa_2nd_pred = float(gpa_2nd_model.predict(features_scaled, verbose=0)[0][0])

        # Scale GPA predictions from [0, 1] to [0, 4.5] (models use sigmoid output)
        gpa_2nd_pred = gpa_2nd_pred * 4.5

        # Clamp predictions to valid ranges
        persistence_prob = max(0.0, min(1.0, persistence_pred))
        completion_prob = max(0.0, min(1.0, completion_pred))
        gpa_2nd = max(0.0, min(4.5, gpa_2nd_pred))

        return jsonify({
            "status": "success",
            "persistenceProbability": round(persistence_prob, 4),
            "completionProbability": round(completion_prob, 4),
            "predictedSecondTermGpa": round(gpa_2nd, 2),
            "providedFirstTermGpa": float(data.get("firstTermGpa", 0))
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Prediction error: {str(e)}"
        }), 400


@app.route('/validate-entry', methods=['POST'])
def validate_entry():
    """
    Validate and acknowledge entry-level data (Step 1 of form).
    Does NOT predict 1st term GPA - the model has poor predictive power (R² = -0.0298).
    
    NOTE: Prediction of 1st term GPA from entry features alone (High School, Math, English)
    is unreliable. The model performs worse than a simple mean predictor.
    
    Input JSON (3 features):
    {
        "highSchool": 0-100,
        "mathScore": 0-50,
        "englishGrade": 1-11
    }
    
    Returns:
    {
        "status": "success",
        "message": "Entry data validated. Please provide your actual 1st term GPA for outcome predictions."
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400

        # Validate required fields
        required = ["highSchool", "mathScore", "englishGrade"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing)}"
            }), 400

        # Validate ranges
        try:
            hs = float(data["highSchool"])
            math = float(data["mathScore"])
            eng = int(data["englishGrade"])
            
            if not (0 <= hs <= 100):
                raise ValueError("High School Average must be 0-100")
            if not (0 <= math <= 50):
                raise ValueError("Math Score must be 0-50")
            if not (1 <= eng <= 11):
                raise ValueError("English Grade must be 1-11")
        except (ValueError, TypeError) as e:
            return jsonify({"status": "error", "message": str(e)}), 400

        return jsonify({
            "status": "success",
            "message": "Entry data validated. Please provide your actual 1st term GPA to predict student outcomes.",
            "entryData": {
                "highSchool": hs,
                "mathScore": math,
                "englishGrade": eng
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Validation error: {str(e)}"
        }), 400


if __name__ == '__main__':
    # Load models on startup
    if load_models():
        # Use PORT environment variable for Render, default to 5000 for local
        port = int(os.environ.get('PORT', 5000))
        print(f"Starting Flask app on port {port}...")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("Failed to load models. Exiting.")
        exit(1)
