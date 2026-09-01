import json
import html

with open("../online-valid.json", encoding="utf-8") as f:
    data = json.load(f)

targets = set()
for entry in data:
    t = entry.get("target")
    if not t or t == "Other":
        continue
    targets.add(t)

cleaned = []
for name in targets:
    fixed = html.unescape(name)
    try:
        fixed = fixed.encode("latin1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass
    cleaned.append(fixed.strip().lower())

EXCLUDE = {"orange", "visa", "nets", "das kann bank"}
cleaned = set(name for name in cleaned if name not in EXCLUDE)

SUPPLEMENT = {
    "usps", "fedex", "ups", "zoom", "outlook", "spotify", "roblox",
    "discord", "telegram", "snapchat", "tiktok", "venmo", "cash app",
    "zelle", "geico", "verizon", "t-mobile", "uber", "airbnb", "github"
}
cleaned |= SUPPLEMENT

final = sorted(cleaned)

with open("../known_brands.json", "w", encoding="utf-8") as f:
    json.dump(final, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(final)} brand names to known_brands.json")