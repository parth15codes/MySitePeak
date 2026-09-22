async function runScan() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  const domainEl = document.getElementById("site-domain");
  const urlEl = document.getElementById("site-url");
  const resultCard = document.getElementById("result-card");
  const titleEl = document.getElementById("risk-title");
  const subtitleEl = document.getElementById("risk-subtitle");
  const reasonsList = document.getElementById("reasons");

  resultCard.className = "neutral";
  titleEl.textContent = "🔄 Scanning...";
  subtitleEl.textContent = "";
  reasonsList.innerHTML = "";

  await new Promise(resolve => setTimeout(resolve, 400));

  if (currentTab && currentTab.url && (currentTab.url.startsWith("http://") || currentTab.url.startsWith("https://"))) {
    const hostname = new URL(currentTab.url).hostname;
    domainEl.textContent = hostname;
    urlEl.textContent = currentTab.url;

    const knownSafe = await isKnownDomain(hostname);

    if (knownSafe) {
      resultCard.className = "low-risk";
      titleEl.innerHTML = "🟢 LOW RISK";
      subtitleEl.textContent = "Known trusted domain";
      reasonsList.innerHTML = `
        <li>✓ Domain appears on a list of well-established, trusted sites</li>
        <li>✓ ${currentTab.url.startsWith("https") ? "HTTPS enabled" : "Note: not using HTTPS"}</li>
      `;
    } else {
      const { score, reasons } = analyzeUrl(currentTab.url);
      const level = getRiskLevel(score);

      let emoji = "🟢", label = "LOW RISK", subtitle = "No significant risk factors found", cls = "low-risk";
      if (level === "Medium Risk") {
        emoji = "🟠"; label = "MEDIUM RISK"; subtitle = "Some suspicious patterns detected"; cls = "medium-risk";
      } else if (level === "High Risk") {
        emoji = "🔴"; label = "HIGH RISK"; subtitle = "Multiple phishing indicators found"; cls = "high-risk";
      }

      resultCard.className = cls;
      titleEl.innerHTML = `${emoji} ${label}`;
      subtitleEl.textContent = subtitle;

      if (reasons.length === 0) {
        reasonsList.innerHTML = "<li>✓ No risk factors detected</li>";
      } else {
        const icon = level === "High Risk" ? "🚨" : "⚠";
        reasonsList.innerHTML = reasons.map(r => `<li>${icon} ${r}</li>`).join("");
      }
    }

    try {
      const features = extractMLFeatures(currentTab.url);
      const phishingProb = await predictWithML(features);
      const mlPercent = Math.round(phishingProb * 100);
      console.log(`[MySitePeak ML - dev only] ${currentTab.url} -> ${mlPercent}% phishing probability`);
    } catch (err) {
      console.error("ML prediction failed:", err);
    }
  } else {
    domainEl.textContent = "N/A";
    urlEl.textContent = currentTab?.url || "Unknown page";
    resultCard.className = "neutral";
    titleEl.textContent = "Not applicable";
    subtitleEl.textContent = "Internal or non-web page";
    reasonsList.innerHTML = "";
  }
}

async function runPageAnalysis() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  const card = document.getElementById("page-analysis-card");
  const statusEl = document.getElementById("page-analysis-status");
  const findingsList = document.getElementById("page-analysis-findings");

  card.className = "neutral";
  statusEl.textContent = "Checking page source...";
  findingsList.innerHTML = "";

  if (!currentTab || !currentTab.id) {
    statusEl.textContent = "Page analysis unavailable on this page";
    return;
  }

  try {
    const result = await chrome.tabs.sendMessage(currentTab.id, { type: "RUN_SOURCE_ANALYSIS" });

    if (!result) {
      statusEl.textContent = "Page analysis unavailable on this page";
      return;
    }

    if (result.findings.length === 0) {
      card.className = "low-risk";
      statusEl.textContent = "No source-level warning signs found";
    } else {
      const hasHigh = result.findings.some(f => f.severity === "high");
      const hasMedium = result.findings.some(f => f.severity === "medium");

      if (hasHigh) {
        card.className = "high-risk";
      } else if (hasMedium) {
        card.className = "medium-risk";
      } else {
        card.className = "low-risk";
      }

      statusEl.textContent = `${result.findings.length} finding(s) detected`;
      findingsList.innerHTML = result.findings.map(f => `<li>${f.message}</li>`).join("");
    }
  } catch (err) {
    statusEl.textContent = "Page analysis unavailable on this page";
  }
}

function playVaultSequence(minDurationMs) {
  const overlay = document.getElementById("vault-overlay");
  const statusEl = document.getElementById("vault-status");

  overlay.classList.add("stage-verifying");
  statusEl.textContent = "VERIFYING...";

  return new Promise(resolve => {
    setTimeout(() => {
      statusEl.textContent = "ACCESS GRANTED";
      overlay.classList.add("stage-open");
      setTimeout(resolve, 700);
    }, minDurationMs);
  });
}

async function init() {
  const overlay = document.getElementById("vault-overlay");

  document.getElementById("scan-again").addEventListener("click", () => {
    const btn = document.getElementById("scan-again");
    btn.disabled = true;
    btn.textContent = "Scanning...";
    runScan().finally(() => {
      btn.disabled = false;
      btn.textContent = "↻ Scan Again";
    });
  });

  const scanPromise = runScan();
  const pageAnalysisPromise = runPageAnalysis();
  const vaultPromise = playVaultSequence(2200);

  await Promise.all([scanPromise, pageAnalysisPromise, vaultPromise]);

  overlay.classList.add("vault-hidden");
}

init();