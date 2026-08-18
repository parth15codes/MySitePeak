import joblib
import json

print("Loading saved model...")
model = joblib.load('phishing_model.pkl')

# Feature names, in the exact order they were used during training
feature_names = [
    'url_length', 'hostname_length', 'has_ip', 'is_https',
    'dot_count', 'hyphen_count', 'has_at_symbol', 'digit_count',
    'suspicious_word_count', 'subdomain_count'
]

def export_tree(tree):
    """Convert one sklearn decision tree into a nested dict structure."""
    tree_ = tree.tree_

    def recurse(node_id):
        if tree_.feature[node_id] != -2:  # -2 means leaf node
            feature_index = tree_.feature[node_id]
            threshold = tree_.threshold[node_id]
            left = recurse(tree_.children_left[node_id])
            right = recurse(tree_.children_right[node_id])
            return {
                "feature": feature_names[feature_index],
                "threshold": round(float(threshold), 4),
                "left": left,
                "right": right
            }
        else:
            # Leaf node: return class probabilities
            value = tree_.value[node_id][0]
            total = sum(value)
            phishing_prob = value[1] / total if total > 0 else 0
            return {"leaf": True, "phishing_prob": round(float(phishing_prob), 4)}

    return recurse(0)

print(f"Exporting {len(model.estimators_)} trees...")
forest_data = [export_tree(tree) for tree in model.estimators_]

with open('forest_model.json', 'w') as f:
    json.dump({"trees": forest_data, "features": feature_names}, f)

print("Exported to forest_model.json")