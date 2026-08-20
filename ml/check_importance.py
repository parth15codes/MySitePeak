import joblib

model = joblib.load('phishing_model.pkl')

feature_names = [
    'hostname_length', 'path_length', 'has_ip', 'is_https',
    'dot_count', 'hyphen_count', 'has_at_symbol',
    'digit_ratio_hostname', 'suspicious_word_count',
    'subdomain_count', 'hostname_entropy', 'is_known_domain'
]

importances = model.feature_importances_
for name, importance in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
    print(f"{name:<25} {importance:.4f}")
