if (typeof importScripts === "function") {
  importScripts("heuristics.js", "known_domains_check.js");
}

async function updateBadge(tabId, url) {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  let level = "Low Risk";
  let reasons = [];

  const knownSafe = await isKnownDomain(new URL(url).hostname);
  if (!knownSafe) {
    const result = analyzeUrl(url);
    level = getRiskLevel(result.score);
    reasons = result.reasons;
  }

  let color = "#28a745";
  let text = "OK";

  if (level === "Medium Risk") {
    color = "#ffc107";
    text = "!";
  } else if (level === "High Risk") {
    color = "#dc3545";
    text = "!!";
  }

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });

  chrome.tabs.sendMessage(tabId, { type: "RISK_RESULT", level, reasons }).catch(() => {});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateBadge(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId).then(tab => updateBadge(tabId, tab.url)).catch(() => {});
});
