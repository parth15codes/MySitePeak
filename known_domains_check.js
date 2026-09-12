let knownDomainsSet = null;

async function loadKnownDomains() {
  if (knownDomainsSet) return knownDomainsSet;
  const response = await fetch(chrome.runtime.getURL("known_domains.json"));
  const domainsArray = await response.json();
  knownDomainsSet = new Set(domainsArray);
  return knownDomainsSet;
}

const COMPOUND_SUFFIXES = new Set([
  "co.uk", "co.in", "co.jp", "co.kr", "co.nz", "co.za", "co.il", "co.id",
  "com.au", "com.br", "com.mx", "com.sg", "com.tw", "com.hk", "com.cn",
  "org.uk", "net.au", "gov.uk", "ac.in", "ac.uk"
]);

function getRegisteredDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length < 2) return hostname;

  const lastTwo = parts.slice(-2).join(".");
  if (COMPOUND_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }

  return lastTwo;
}

async function isKnownDomain(hostname) {
  const domains = await loadKnownDomains();
  const registeredDomain = getRegisteredDomain(hostname.toLowerCase());
  return domains.has(registeredDomain);
}