async function analyzeSource() {
  const findings = [];

  const loginForms = detectLoginForms();
  if (loginForms.length > 0) {
    findings.push({
      type: "login_form_detected",
      severity: "info",
      count: loginForms.length,
      message: `Found ${loginForms.length} form(s) with a password field.`
    });

    for (const form of loginForms) {
      const crossDomainFinding = detectCrossDomainSubmission(form);
      if (crossDomainFinding) findings.push(crossDomainFinding);
    }
  }

  const brandFinding = await detectBrandMismatch();
  if (brandFinding) findings.push(brandFinding);

  const linkFindings = await detectSuspiciousLinks();
  findings.push(...linkFindings);

  const typosquatFinding = await detectTyposquat(window.location.hostname);
  if (typosquatFinding) findings.push(typosquatFinding);

  const riskScore = findings.some(f => f.severity === "high") ? 70
    : findings.some(f => f.severity === "medium") ? 40
    : 0;

  return {
    riskScore,
    suspicious: riskScore >= 50,
    findings
  };
}

function detectLoginForms() {
  const passwordFields = Array.from(document.querySelectorAll('input[type="password"]'));
  const forms = new Set();

  for (const field of passwordFields) {
    const form = field.closest("form");
    if (form) forms.add(form);
  }

  return Array.from(forms);
}

function detectCrossDomainSubmission(form) {
  const actionUrl = form.action;
  if (!actionUrl) return null;

  let actionHost;
  try {
    actionHost = new URL(actionUrl).hostname;
  } catch {
    return null;
  }

  const pageHost = window.location.hostname;

  if (getRegistrableDomain(actionHost) !== getRegistrableDomain(pageHost)) {
    return {
      type: "cross_domain_form_submission",
      severity: "high",
      message: `Form submits to ${actionHost}, different from page domain ${pageHost}.`
    };
  }

  return null;
}

const COMPOUND_SUFFIXES = new Set([
  "co.uk", "co.in", "co.jp", "co.kr", "co.nz", "co.za", "co.il", "co.id",
  "com.au", "com.br", "com.mx", "com.sg", "com.tw", "com.hk", "com.cn",
  "org.uk", "net.au", "gov.uk", "ac.in", "ac.uk"
]);

function getRegistrableDomain(hostname) {
  const parts = hostname.toLowerCase().split(".");
  if (parts.length < 2) return hostname;

  const lastTwo = parts.slice(-2).join(".");
  if (COMPOUND_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }

  return lastTwo;
}

function detectHiddenIframes() {
  const iframes = Array.from(document.querySelectorAll("iframe"));
  const hidden = iframes.filter(isHiddenIframe);

  if (hidden.length === 0) return null;

  return {
    type: "hidden_iframe_detected",
    severity: "medium",
    count: hidden.length,
    message: `Found ${hidden.length} hidden or invisible iframe(s) on this page.`
  };
}

function isHiddenIframe(iframe) {
  const style = window.getComputedStyle(iframe);
  const rect = iframe.getBoundingClientRect();

  const zeroSize = rect.width === 0 || rect.height === 0;
  const displayNone = style.display === "none";
  const visibilityHidden = style.visibility === "hidden";
  const offScreen = rect.right < 0 || rect.bottom < 0;

  return zeroSize || displayNone || visibilityHidden || offScreen;
}

function detectHiddenForms() {
  const forms = Array.from(document.querySelectorAll("form"));
  const hidden = forms.filter(isHiddenElement);

  if (hidden.length === 0) return null;

  return {
    type: "hidden_form_detected",
    severity: "medium",
    count: hidden.length,
    message: `Found ${hidden.length} hidden form(s) on this page.`
  };
}

function isHiddenElement(el) {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  const zeroSize = rect.width === 0 || rect.height === 0;
  const displayNone = style.display === "none";
  const visibilityHidden = style.visibility === "hidden";
  const offScreen = rect.right < 0 || rect.bottom < 0;

  return zeroSize || displayNone || visibilityHidden || offScreen;
}

const KNOWN_BRAND_DOMAINS = [
  "paypal.com", "amazon.com", "google.com", "microsoft.com", "apple.com",
  "facebook.com", "instagram.com", "netflix.com", "linkedin.com", "dropbox.com",
  "adobe.com", "coinbase.com", "binance.com", "chase.com", "bankofamerica.com",
  "wellsfargo.com", "americanexpress.com", "ebay.com", "hsbc.com", "citibank.com",
  "outlook.com", "yahoo.com", "twitter.com", "x.com", "whatsapp.com",
  "steampowered.com", "discord.com", "spotify.com", "github.com", "docusign.com"
];

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

async function detectTyposquat(hostname) {
  const domain = getRegistrableDomain(hostname.toLowerCase());

  const knownDomains = await loadKnownDomainsForLinks();
  if (knownDomains.has(domain)) return null;

  for (const realDomain of KNOWN_BRAND_DOMAINS) {
    if (domain === realDomain) continue;

    const distance = levenshteinDistance(domain, realDomain);
    if (distance > 0 && distance <= 2 && Math.abs(domain.length - realDomain.length) <= 2) {
      return {
        type: "typosquat_suspected",
        severity: "high",
        message: `Domain "${domain}" closely resembles known brand domain "${realDomain}" (edit distance ${distance}).`
      };
    }
  }

  return null;
}

// Unwired pending real-world testing: window.location.hostname always
// returns Punycode (xn--...) for ANY non-Latin domain, safe or malicious,
// so this may false-positive on legitimate international sites. Needs
// verification against a real IDN site before it's safe to call from
// analyzeSource().
function detectPunycodeDomain(hostname) {
  const labels = hostname.toLowerCase().split(".");
  const hasPunycode = labels.some(label => label.startsWith("xn--"));

  if (!hasPunycode) return null;

  return {
    type: "punycode_domain_detected",
    severity: "high",
    message: `Domain contains Punycode-encoded characters (${hostname}), often used to mimic Latin lookalike characters.`
  };
}

let knownBrandsSet = null;

async function loadKnownBrands() {
  if (knownBrandsSet) return knownBrandsSet;
  const response = await fetch(chrome.runtime.getURL("known_brands.json"));
  const brandsArray = await response.json();
  knownBrandsSet = brandsArray;
  return knownBrandsSet;
}

async function detectBrandMismatch() {
  const brands = await loadKnownBrands();
  const title = document.title.toLowerCase();
  const pageHost = getRegistrableDomain(window.location.hostname).toLowerCase();

  for (const brand of brands) {
    if (title.includes(brand) && !pageHost.includes(brand)) {
      return {
        type: "title_domain_brand_mismatch",
        severity: "medium",
        message: `Page title mentions "${brand}" but domain is ${pageHost}.`
      };
    }
  }

  return null;
}

let knownDomainsSetForLinks = null;

async function loadKnownDomainsForLinks() {
  if (knownDomainsSetForLinks) return knownDomainsSetForLinks;
  const response = await fetch(chrome.runtime.getURL("known_domains.json"));
  const domainsArray = await response.json();
  knownDomainsSetForLinks = new Set(domainsArray);
  return knownDomainsSetForLinks;
}

async function detectSuspiciousLinks() {
  const brands = await loadKnownBrands();
  const knownDomains = await loadKnownDomainsForLinks();
  const links = Array.from(document.querySelectorAll("a[href]"));
  const findings = [];

  for (const link of links) {
    const text = link.textContent.toLowerCase().trim();
    if (!text) continue;

    let linkHost;
    try {
      linkHost = new URL(link.href, window.location.href).hostname.toLowerCase();
    } catch {
      continue;
    }

    const linkDomain = getRegistrableDomain(linkHost);

    if (knownDomains.has(linkDomain)) continue;

    for (const brand of brands) {
      if (text.includes(brand) && !linkDomain.includes(brand)) {
        findings.push({
          type: "suspicious_link_text_mismatch",
          severity: "medium",
          message: `Link text mentions "${brand}" but points to ${linkDomain}.`
        });
        break;
      }
    }
  }

  return findings;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RUN_SOURCE_ANALYSIS") {
    analyzeSource().then(sendResponse);
    return true;
  }
});