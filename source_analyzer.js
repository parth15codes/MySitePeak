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

function getRegistrableDomain(hostname) {
  const parts = hostname.split(".");
  return parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RUN_SOURCE_ANALYSIS") {
    analyzeSource().then(sendResponse);
    return true;
  }
});