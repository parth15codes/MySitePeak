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