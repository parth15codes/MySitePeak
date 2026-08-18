function updateBadge(tabId, url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    chrome.action.setBadgeText({ tabId, text: "" }); // clear badge on internal pages
    return;
  }

  const { score, reasons } = analyzeUrl(url);
  const level = getRiskLevel(score);

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

  chrome.tabs.sendMessage(tabId, {
    type: "RISK_RESULT",
    level,
    reasons
  }).catch(() => {
    // Ignore errors — happens if content script isn't ready yet on some pages
  });
}