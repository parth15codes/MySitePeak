chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const currentTab = tabs[0];
  const urlDiv = document.getElementById("url");
  const resultDiv = document.getElementById("result");
  const reasonsList = document.getElementById("reasons");

  if (currentTab && currentTab.url && (currentTab.url.startsWith("http://") || currentTab.url.startsWith("https://"))) {
    urlDiv.textContent = currentTab.url;

    // Heuristic scoring (primary, shown to user)
    const { score, reasons } = analyzeUrl(currentTab.url);
    const level = getRiskLevel(score);

    resultDiv.textContent = `${level} (Score: ${score}/100)`;
    resultDiv.className = level.toLowerCase().replace(" ", "-");

    reasonsList.innerHTML = "";
    if (reasons.length === 0) {
      reasonsList.innerHTML = "<li>No risk factors detected.</li>";
    } else {
      reasons.forEach(reason => {
        const li = document.createElement("li");
        li.textContent = reason;
        reasonsList.appendChild(li);
      });
    }

    // ML-based prediction (hidden from UI for now — model needs more tuning)
    try {
      const features = extractMLFeatures(currentTab.url);
      const phishingProb = await predictWithML(features);
      const mlPercent = Math.round(phishingProb * 100);
      console.log(`[MySitePeak ML - dev only] ${currentTab.url} -> ${mlPercent}% phishing probability`);
    } catch (err) {
      console.error("ML prediction failed:", err);
    }
  } else {
    urlDiv.textContent = currentTab?.url || "Unknown page";
    resultDiv.textContent = "Not applicable — internal or non-web page.";
    resultDiv.className = "";
    reasonsList.innerHTML = "";
  }
});