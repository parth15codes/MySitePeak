import joblib
from extract_features import extract_features
import pandas as pd

model = joblib.load('phishing_model.pkl')

feature_names = [
    'hostname_length', 'path_length', 'has_ip', 'is_https',
    'dot_count', 'hyphen_count', 'has_at_symbol',
    'digit_ratio_hostname', 'suspicious_word_count',
    'subdomain_count', 'hostname_entropy'
]

test_urls = [
    "https://www.google.com",
    "https://www.google.com/search?q=how+to+copy+paste+in+git&oq=gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQRRg7MgYIAhBFGDs",
    "https://www.amazon.com",
    "http://paypa1.com/login-verify",
    "http://192.168.1.5/secure-account",
    "http://xk29fj-secure-login.tk"
]

for url in test_urls:
    features = extract_features(url)
    df = pd.DataFrame([features])[feature_names]
    prob = model.predict_proba(df)[0][1]  # probability of class 1 (phishing)
    print(f"{url[:60]:<62} -> {prob*100:.1f}% phishing probability")