import sys
import json
import joblib
import pandas as pd
import os
import warnings
warnings.filterwarnings('ignore') # ignore scikit-learn warnings

def main():
    try:
        # Expecting JSON input as command line argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            return
            
        input_data = json.loads(sys.argv[1])
        sleep_score = input_data.get('sleep_score', 100)
        recovery_score = input_data.get('recovery_score', 100)
        
        # Mapping WHOOP metrics to dataset symptom features
        features = {
            'has_fatigue': 1 if recovery_score < 40 else 0,
            'has_muscle_weakness': 1 if recovery_score < 30 else 0,
            'has_memory_problems': 1 if sleep_score < 50 else 0,
            'has_bone_pain': 0,
            'has_night_blindness': 0,
            'has_bleeding_gums': 0,
            'has_numbness_tingling': 0,
            'has_pale_skin': 1 if (recovery_score < 30 and sleep_score < 50) else 0
        }
        
        # Load model and encoder
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'vitamin_model.pkl')
        encoder_path = os.path.join(script_dir, 'label_encoder.pkl')
        
        if not os.path.exists(model_path) or not os.path.exists(encoder_path):
            print(json.dumps({"error": "Model files not found"}))
            return
            
        model = joblib.load(model_path)
        encoder = joblib.load(encoder_path)
        
        # Prepare dataframe
        df = pd.DataFrame([features])
        
        # Predict
        prediction = model.predict(df)[0]
        prediction_label = encoder.inverse_transform([prediction])[0]
        
        # Confidence score (max probability)
        probabilities = model.predict_proba(df)[0]
        confidence = float(max(probabilities))
        
        output = {
            "prediction": prediction_label,
            "confidence": confidence,
            "mapped_features": features
        }
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
