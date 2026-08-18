import pandas as pd
from extract_features import extract_features

df = pd.read_csv("phishing_site_urls.csv")
df = df.sample(n=5000, random_state=42)  # quick sample for speed

feature_rows = df['URL'].apply(extract_features)
features_df = pd.DataFrame(list(feature_rows))
features_df['label'] = df['Label'].values

print("=== Average feature values by class ===")
print(features_df.groupby('label').mean())

print("\n=== Sample of 'good' URLs in dataset ===")
print(df[df['Label'] == 'good']['URL'].head(15).to_string())