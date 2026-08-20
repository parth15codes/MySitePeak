let knownDomainsSet = null;

async function loadKnownDomains() {
  if (knownDomainsSet) return knownDomainsSet;
  const response = await fetch(chrome.runtime.getURL("known_domains.json"));
  const domainsArray = await response.json();
  knownDomainsSet = new Set(domainsArray);
  return knownDomainsSet;
}

function getRegisteredDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
}

async function isKnownDomain(hostname) {
  const domains = await loadKnownDomains();
  const registeredDomain = getRegisteredDomain(hostname.toLowerCase());
  return domains.has(registeredDomain);
}