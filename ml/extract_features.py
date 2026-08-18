import pandas as pd
import re
from urllib.parse import urlparse

def extract_features(url):
    features = {}

    try:
        # Ensure URL has a scheme so urlparse works correctly
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "http://" + url

        parsed = urlparse(url)
        hostname = parsed.hostname or ""

        features['url_length'] = len(url)
        features['hostname_length'] = len(hostname)

        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        features['has_ip'] = 1 if re.match(ip_pattern, hostname) else 0

        features['is_https'] = 1 if parsed.scheme == "https" else 0
        features['dot_count'] = hostname.count('.')
        features['hyphen_count'] = url.count('-')
        features['has_at_symbol'] = 1 if '@' in url else 0
        features['digit_count'] = sum(c.isdigit() for c in url)

        suspicious_words = ['login', 'verify', 'secure', 'account', 'update', 'signin', 'confirm', 'banking']
        features['suspicious_word_count'] = sum(word in url.lower() for word in suspicious_words)

        features['subdomain_count'] = max(hostname.count('.') - 1, 0)

    except Exception:
        # If URL is malformed, treat it as maximally suspicious
        features = {
            'url_length': len(url) if isinstance(url, str) else 0,
            'hostname_length': 0,
            'has_ip': 0,
            'is_https': 0,
            'dot_count': 0,
            'hyphen_count': 0,
            'has_at_symbol': 0,
            'digit_count': 0,
            'suspicious_word_count': 0,
            'subdomain_count': 0,
        }

    return features


if __name__ == "__main__":
    test_urls = [
        "https://www.google.com",
        "http://paypa1.com/login-verify",
        "http://192.168.1.5/secure-account"
    ]

    for u in test_urls:
        print(u, "->", extract_features(u))