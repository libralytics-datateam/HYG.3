import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.preprocessing import LabelEncoder

# 1. Load Data
dataset_path = 'C:\\Users\\ADMIN\\.cache\\kagglehub\\datasets\\nudratabbas\\vitamin-deficiency-disease-prediction-dataset\\versions\\1\\vitamin_deficiency_disease_dataset_20260123.csv'
df = pd.read_csv(dataset_path)

# 2. Select Features mapped to WHOOP Biometrics
# We'll use symptom-based features that can be derived from wearables or self-reported
features = [
    'has_fatigue',
    'has_muscle_weakness',
    'has_memory_problems',
    'has_bone_pain',
    'has_night_blindness',
    'has_bleeding_gums',
    'has_numbness_tingling',
    'has_pale_skin'
]
X = df[features]
y = df['disease_diagnosis']

# Encode the target variable
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# 3. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# 4. Train Model (Random Forest)
model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
model.fit(X_train, y_train)

# 5. Evaluate (Replicating the F1-Score 97 kernel goal)
y_pred = model.predict(X_test)
f1 = f1_score(y_test, y_pred, average='weighted')
print(f"Validation F1-Score: {f1:.4f}")
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# 6. Save Model & Encoder
# Save to the server/ml directory so the backend API can use it
import os
os.makedirs('../server/ml', exist_ok=True)
joblib.dump(model, '../server/ml/vitamin_model.pkl')
joblib.dump(le, '../server/ml/label_encoder.pkl')
print("Model exported successfully to server/ml/vitamin_model.pkl")
