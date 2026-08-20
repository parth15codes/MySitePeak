async function runScan() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  const domainEl = document.getElementById("site-domain");
  const urlEl = document.getElementById("site-url");
  const resultCard = document.getElementById("result-card");
  const titleEl = document.getElementById("risk-title");
  const subtitleEl = document.getElementById("risk-subtitle");
  const reasonsList = document.getElementById("reasons");

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

    // ML prediction - dev console only
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

document.getElementById("scan-again").addEventListener("click", runScan);
runScan();