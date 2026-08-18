import re
import math
from urllib.parse import urlparse

def shannon_entropy(s):
    """Measures randomness of a string. Higher = more random-looking."""
    if not s:
        return 0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    entropy = 0
    length = len(s)
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


def extract_features(url):
    try:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "http://" + url

        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        path = parsed.path or ""

        features = {}

        features['hostname_length'] = len(hostname)
        features['path_length'] = len(path)

        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        features['has_ip'] = 1 if re.match(ip_pattern, hostname) else 0

        features['is_https'] = 1 if parsed.scheme == "https" else 0

        features['dot_count'] = hostname.count('.')

        # Hyphen count in HOSTNAME only, not full URL/query string
        features['hyphen_count'] = hostname.count('-')

        features['has_at_symbol'] = 1 if '@' in url else 0

        # Digit ratio in hostname (not raw digit count on full URL)
        digit_count_hostname = sum(c.isdigit() for c in hostname)
        features['digit_ratio_hostname'] = (
            digit_count_hostname / len(hostname) if len(hostname) > 0 else 0
        )

        # Suspicious words checked in HOSTNAME only, not path/query
        suspicious_words = ['login', 'verify', 'secure', 'account', 'update', 'signin', 'confirm', 'banking']
        lower_host = hostname.lower()
        features['suspicious_word_count'] = sum(word in lower_host for word in suspicious_words)

        features['subdomain_count'] = max(hostname.count('.') - 1, 0)

        # Entropy of hostname - randomness indicator
        features['hostname_entropy'] = shannon_entropy(hostname)

        return features

    except Exception:
        return {
            'hostname_length': 0, 'path_length': 0, 'has_ip': 0, 'is_https': 0,
            'dot_count': 0, 'hyphen_count': 0, 'has_at_symbol': 0,
            'digit_ratio_hostname': 0, 'suspicious_word_count': 0,
            'subdomain_count': 0, 'hostname_entropy': 0,
        }


if __name__ == "__main__":
    test_urls = [
        "https://www.google.com",
        "https://www.google.com/search?q=how+to+copy+paste+in+git&oq=gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQRRg7MgYIAhBFGDs",
        "https://www.amazon.com",
        "http://paypa1.com/login-verify",
        "http://192.168.1.5/secure-account",
        "http://xk29fj-secure-login.tk"
    ]
    for u in test_urls:
        print(u[:60], "->", extract_features(u))