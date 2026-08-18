function extractMLFeatures(urlString) {
  let url = urlString;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "http://" + url;
  }

  let hostname = "";
  let isHttps = 0;

  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
    isHttps = parsed.protocol === "https:" ? 1 : 0;
  } catch (e) {
    // malformed URL - return zeroed features, matching Python's fallback behavior
    return {
      url_length: url.length,
      hostname_length: 0,
      has_ip: 0,
      is_https: 0,
      dot_count: 0,
      hyphen_count: 0,
      has_at_symbol: 0,
      digit_count: 0,
      suspicious_word_count: 0,
      subdomain_count: 0
    };
  }

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const hasIp = ipPattern.test(hostname) ? 1 : 0;

  const dotCount = (hostname.match(/\./g) || []).length;
  const hyphenCount = (url.match(/-/g) || []).length;
  const hasAtSymbol = url.includes("@") ? 1 : 0;
  const digitCount = (url.match(/\d/g) || []).length;

  const suspiciousWords = ["login", "verify", "secure", "account", "update", "signin", "confirm", "banking"];
  const lowerUrl = url.toLowerCase();
  const suspiciousWordCount = suspiciousWords.filter(word => lowerUrl.includes(word)).length;

  const subdomainCount = Math.max(dotCount - 1, 0);

  return {
    url_length: url.length,
    hostname_length: hostname.length,
    has_ip: hasIp,
    is_https: isHttps,
    dot_count: dotCount,
    hyphen_count: hyphenCount,
    has_at_symbol: hasAtSymbol,
    digit_count: digitCount,
    suspicious_word_count: suspiciousWordCount,
    subdomain_count: subdomainCount
  };
}