from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow your React app to call this API

@app.route('/predict', methods=['POST'])
def predict():

    data = request.get_json()

    # Extract all fields
    highSchool = float(data["highSchool"])
    mathScore = float(data["mathScore"])
    englishGrade = int(data["englishGrade"])
    firstTermGpa = float(data["firstTermGpa"])
    ageGroup = int(data["ageGroup"])
    gender = int(data["gender"])
    residency = int(data["residency"])
    firstLanguage = int(data["firstLanguage"])
    fastTrack = int(data["fastTrack"])
    coop = int(data["coop"])
    prevEducation = int(data["prevEducation"])
    school = int(data["school"])
    funding = int(data["funding"])

    # -------------------------
    # FOR NOW: Return dummy value
    # -------------------------
    dummy_prediction = 3.21

    return jsonify({
        "status": "success",
        "predictedGpa": dummy_prediction,
        "received": data
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
