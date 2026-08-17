function analyzeUrl(urlString) {
  let score = 0;
  const reasons = [];

  let url;
  try {
    url = new URL(urlString);
  } catch (e) {
    return { score: 0, reasons: ["Could not parse URL."] };
  }

  const hostname = url.hostname;
  const protocol = url.protocol;

  if (protocol !== "https:") {
    score += 20;
    reasons.push("Site is not using HTTPS.");
  }

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    score += 30;
    reasons.push("URL uses a raw IP address instead of a domain name.");
  }

  const subdomainCount = hostname.split(".").length - 2;
  if (subdomainCount > 2) {
    score += 15;
    reasons.push("URL has an unusually high number of subdomains.");
  }

  const suspiciousWords = ["login", "verify", "secure", "account", "update", "signin", "confirm"];
  const lowerHost = hostname.toLowerCase();
  const foundWord = suspiciousWords.find(word => lowerHost.includes(word));
  if (foundWord) {
    score += 15;
    reasons.push(`Domain contains suspicious keyword: "${foundWord}".`);
  }

  if (hostname.length > 40) {
    score += 10;
    reasons.push("Domain name is unusually long.");
  }

  const suspiciousTlds = [".tk", ".ml", ".ga", ".cf", ".xyz", ".top", ".click"];
  if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
    score += 20;
    reasons.push("Domain uses a TLD commonly associated with phishing.");
  }
// 7. Punycode / homograph detection
  if (hostname.includes("xn--")) {
    score += 25;
    reasons.push("Domain uses punycode encoding — possible lookalike character trick.");
  }

  // 8. Brand impersonation (lookalike domains)
  const commonBrands = [
    "paypal", "amazon", "google", "microsoft", "apple", "facebook",
    "netflix", "bankofamerica", "chase", "wellsfargo", "instagram", "linkedin"
  ];

  function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = 1 + Math.min(
            matrix[i - 1][j],     // deletion
            matrix[i][j - 1],     // insertion
            matrix[i - 1][j - 1]  // substitution
          );
        }
      }
    }
    return matrix[a.length][b.length];
  }

  // Extract the main domain label (e.g. "paypa1" from "paypa1.com")
  const domainParts = hostname.replace(/^www\./, "").split(".");
  const mainLabel = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domainParts[0];

  for (const brand of commonBrands) {
    if (mainLabel === brand) break; // exact match = legit, skip

    const distance = levenshteinDistance(mainLabel, brand);
    // Close match (1-2 char difference) but not exact = suspicious
    if (distance > 0 && distance <= 2 && mainLabel.length >= brand.length - 2) {
      score += 35;
      reasons.push(`Domain closely resembles "${brand}" but is not the official domain.`);
      break; // only flag once
    }
  }
  score = Math.min(score, 100);
  return { score, reasons };
}

function getRiskLevel(score) {
  if (score >= 50) return "High Risk";
  if (score >= 20) return "Medium Risk";
  return "Low Risk";
}