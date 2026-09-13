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