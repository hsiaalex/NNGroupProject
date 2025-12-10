# Student Performance Predictor - Setup & Run Guide

## Overview
This project consists of a **Python Flask backend** (predictions API) and a **React frontend** (student input form).

---

## Prerequisites
- **Python 3.8+** installed
- **Node.js & npm** installed
- **Git** (optional, for cloning)

---

## Backend Setup

### 1. Install Python Dependencies
Navigate to the `backend/` directory and install required packages:

```bash
cd backend
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install these manually:
```bash
pip install flask flask-cors numpy tensorflow
```

### 2. Verify Models Are Present
Ensure these files exist in the `model/` directory:
- `completion_model_nn.keras`
- `gpa_2nd_model_nn.keras`
- `persistence_model_nn.keras`
- `scaler_main_features.pkl`

### 3. Run the Backend Server
```bash
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

The backend will be available at `http://localhost:5000`

---

## Frontend Setup

### 1. Install Node Dependencies
Open a **new terminal** and navigate to the `student-ui/` directory:

```bash
cd student-ui
npm install
```

### 2. Run the Development Server
```bash
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view student-ui in the browser.
Local:            http://localhost:3000
```

The frontend will open automatically in your browser at `http://localhost:3000`

---

## Using the Application

1. **Fill out the form** with student information across three sections:
   - Academic Information (GPA, Math Score, English Level, Previous Education)
   - Personal Information (Age, Gender, Residency, First Language)
   - Program Information (Fast Track, Co-op, School, Funding Type)

2. **Click "GET PREDICTIONS"** to submit the form

3. **View results** below the form:
   - Predicted 2nd Term GPA
   - 1st Year Persistence probability
   - Program Completion probability

4. **Click "CLEAR PREDICTIONS"** to reset and try another prediction

---

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed: `python --version`
- Check that all model files exist in `model/` directory
- Try reinstalling dependencies: `pip install --upgrade tensorflow`

### Frontend won't compile
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -r node_modules && npm install`
- Ensure Node.js is up to date: `node --version`

### Connection refused error
- Make sure backend is running on port 5000
- Make sure frontend is running on port 3000
- Check that both are running in separate terminals

### Predictions fail
- Check backend console for error messages
- Verify all model files are present and not corrupted
- Ensure form validation passes (all fields are required)

---

## Project Structure
```
NNGroupProject/
├── backend/
│   ├── app.py                 # Flask server & prediction endpoints
│   └── __pycache__/
├── model/
│   ├── NeuralNetworkModels.ipynb  # Model training notebook
│   ├── completion_model_nn.keras
│   ├── gpa_2nd_model_nn.keras
│   ├── persistence_model_nn.keras
│   ├── scaler_main_features.pkl
│   └── Student data.csv
└── student-ui/
    ├── src/
    │   ├── App.js            # Main React component with form
    │   ├── App.css
    │   └── index.js
    ├── public/
    ├── package.json
    └── README.md
```

---

## API Endpoints

### POST `/predict`
Accepts student data and returns predictions.

**Request body:**
```json
{
  "highSchool": 85.5,
  "mathScore": 42,
  "englishGrade": 3,
  "firstTermGpa": 3.2,
  "ageGroup": 2,
  "gender": 1,
  "residency": 1,
  "firstLanguage": 1,
  "fastTrack": 1,
  "coop": 2,
  "prevEducation": 1,
  "school": 2,
  "funding": 1
}
```

**Response:**
```json
{
  "status": "success",
  "predictedSecondTermGpa": 3.45,
  "persistenceProbability": 0.87,
  "completionProbability": 0.92,
  "providedFirstTermGpa": 3.2
}
```

---

## Notes
- The backend must be running before making predictions from the frontend
- All form fields are **required**
- The frontend uses Material-UI components for styling
- Predictions are based on 3 trained neural network models
