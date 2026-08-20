import pandas as pd
from extract_features import extract_features

df = pd.read_csv("phishing_site_urls.csv")
df = df.sample(n=50000, random_state=42)

feature_rows = df['URL'].apply(extract_features)
features_df = pd.DataFrame(list(feature_rows))
features_df['label'] = df['Label'].values

subset = features_df[(features_df['is_known_domain'] == 1) & (features_df['path_length'] == 0)]
print(f"Known domain + empty path rows: {len(subset)}")
print(subset['label'].value_counts())

subset2 = features_df[(features_df['is_known_domain'] == 1) & (features_df['path_length'] > 0)]
print(f"\nKnown domain + non-empty path rows: {len(subset2)}")
print(subset2['label'].value_counts())
