function showWarningBanner(reasons) {
  if (document.getElementById("mysitepeak-banner")) return;

  const banner = document.createElement("div");
  banner.id = "mysitepeak-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: #dc3545;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    padding: 10px 16px;
    z-index: 2147483647;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const text = document.createElement("span");
  text.textContent = "⚠️ MySitePeak Warning: This site shows signs of phishing. " + reasons.join(" ");

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: 12px;
  `;
  closeBtn.onclick = () => banner.remove();

  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "RISK_RESULT" && message.level === "High Risk") {
    showWarningBanner(message.reasons);
  }
});