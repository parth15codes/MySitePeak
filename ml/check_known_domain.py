import pandas as pd
from extract_features import extract_features

df = pd.read_csv("phishing_site_urls.csv")
df = df.sample(n=50000, random_state=42)

feature_rows = df['URL'].apply(extract_features)
features_df = pd.DataFrame(list(feature_rows))
features_df['label'] = df['Label'].values

known_domain_rows = features_df[features_df['is_known_domain'] == 1]
print(f"Total rows with is_known_domain=1: {len(known_domain_rows)}")
print(known_domain_rows['label'].value_counts())
