function analyzeSource() {
  const findings = [];

  // check 1: login/password form detection
  // check 2: cross-domain form submission
  // check 3: title/brand vs domain mismatch

  const riskScore = 0;

  return {
    riskScore,
    suspicious: riskScore >= 50,
    findings
  };
}