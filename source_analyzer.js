function analyzeSource() {
  const findings = [];

  const loginForms = detectLoginForms();
  if (loginForms.length > 0) {
    findings.push({
      type: "login_form_detected",
      severity: "info",
      count: loginForms.length,
      message: `Found ${loginForms.length} form(s) with a password field.`
    });
  }

  const riskScore = 0;

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
  const actionUrl = form.action; // browser resolves relative URLs automatically
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