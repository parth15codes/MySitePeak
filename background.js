importScripts("heuristics.js");

function updateBadge(tabId, url) {
  const { score } = analyzeUrl(url);
  const level = getRiskLevel(score);

  let color = "#28a745"; // green - low
  let text = "OK";

  if (level === "Medium Risk") {
    color = "#ffc107"; // yellow
    text = "!";
  } else if (level === "High Risk") {
    color = "#dc3545"; // red
    text = "!!";
  }

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

// Runs when user switches tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) updateBadge(tab.id, tab.url);
  });
});

// Runs when a tab finishes loading a new URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadge(tabId, tab.url);
  }
});