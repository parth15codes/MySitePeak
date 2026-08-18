import pandas as pd
from extract_features import extract_features
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

print("Loading dataset...")
df = pd.read_csv("phishing_site_urls.csv")

# Optional: use a smaller sample first to make sure everything works fast
# Comment this out later once you're ready for the full dataset
# df = df.sample(n=20000, random_state=42)

print(f"Dataset size: {len(df)} rows")

print("Extracting features... (this may take a minute)")
feature_rows = df['URL'].apply(extract_features)
features_df = pd.DataFrame(list(feature_rows))

# Convert labels: 'bad' -> 1 (phishing), 'good' -> 0 (legitimate)
labels = df['Label'].apply(lambda x: 1 if x == 'bad' else 0)

print("Splitting into train/test sets...")
X_train, X_test, y_train, y_test = train_test_split(
    features_df, labels, test_size=0.2, random_state=42
)

print("Training model...")
model = RandomForestClassifier(
    n_estimators=30,
    max_depth=12,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

print("Evaluating model...")
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"\nAccuracy: {accuracy:.4f}")
print("\nDetailed report:")
print(classification_report(y_test, predictions, target_names=['Legitimate', 'Phishing']))
import joblib
joblib.dump(model, 'phishing_model.pkl')
print("\nModel saved to phishing_model.pkl")