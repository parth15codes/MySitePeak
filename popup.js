chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const urlDiv = document.getElementById("url");
  const resultDiv = document.getElementById("result");
  const reasonsList = document.getElementById("reasons");

  if (currentTab && currentTab.url) {
    urlDiv.textContent = currentTab.url;

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
  } else {
    urlDiv.textContent = "Could not read URL.";
  }
});