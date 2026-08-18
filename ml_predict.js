let forestModel = null;

// Load the exported model JSON once, cache it
async function loadModel() {
  if (forestModel) return forestModel;
  const response = await fetch(chrome.runtime.getURL("forest_model.json"));
  forestModel = await response.json();
  return forestModel;
}

// Walk a single tree given a feature object, return phishing probability
function predictTree(node, features) {
  if (node.leaf) {
    return node.phishing_prob;
  }
  const featureValue = features[node.feature];
  if (featureValue <= node.threshold) {
    return predictTree(node.left, features);
  } else {
    return predictTree(node.right, features);
  }
}

// Run the full forest: average the probability across all trees
async function predictWithML(features) {
  const model = await loadModel();
  const probs = model.trees.map(tree => predictTree(tree, features));
  const avgProb = probs.reduce((sum, p) => sum + p, 0) / probs.length;
  return avgProb; // 0.0 to 1.0, probability of phishing
}