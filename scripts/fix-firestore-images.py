#!/usr/bin/env python3
"""
One-time migration: update broken product image URLs in Firestore.
Uses the Firebase CLI's stored OAuth2 token — no extra auth needed.
"""

import json, urllib.request, urllib.parse, urllib.error, time

PROJECT_ID = "nextclass-d2364"
BASE_URL   = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

# ── Load access token from Firebase CLI ─────────────────────────────────────
with open("/Users/efraimmac/.config/configstore/firebase-tools.json") as f:
    cli_config = json.load(f)

tokens        = cli_config.get("tokens", {})
access_token  = tokens.get("access_token", "")
refresh_token = tokens.get("refresh_token", "")

CLIENT_ID     = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com"
CLIENT_SECRET = "j9iVZfS8CtKt6rR4jUGi7n-5"  # Firebase CLI public client secret

def refresh_access_token():
    """Refresh the OAuth2 access token using the stored refresh token."""
    data = urllib.parse.urlencode({
        "grant_type":    "refresh_token",
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, method="POST")
    with urllib.request.urlopen(req) as resp:
        result = json.load(resp)
    return result["access_token"]

def firestore_get(path):
    req = urllib.request.Request(
        f"{BASE_URL}/{path}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

def firestore_patch(doc_path, fields):
    """PATCH only the specified fields on a Firestore document."""
    update_mask = "&".join(f"updateMask.fieldPaths={k}" for k in fields)
    url  = f"{BASE_URL}/{doc_path}?{update_mask}"
    body = json.dumps({"fields": {
        k: {"stringValue": v} for k, v in fields.items()
    }}).encode()
    req  = urllib.request.Request(url, data=body, method="PATCH",
                                   headers={"Authorization": f"Bearer {access_token}",
                                            "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

# ── Broken photo-ID prefix → correct full URL ────────────────────────────────
# Key = prefix of the broken photo ID (unique enough to match)
# Val = the final correct URL (matching what's now in products.js)
FIXES = {
    "photo-1517604931442": "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&q=80&w=800",
    "photo-1492690138406": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800",
    "photo-1516321497487": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    "photo-1461151304267": "https://images.unsplash.com/photo-1637656375538-9dfe600ccfd2?auto=format&fit=crop&q=80&w=800",
    "photo-1542744173":    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800",
    "photo-1526657782461": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
    "photo-1525373612132": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800",
    "photo-1542031021":    "https://images.unsplash.com/photo-1563520239648-a24e51d4b570?auto=format&fit=crop&q=80&w=800",
    "photo-1561149831":    "https://images.unsplash.com/photo-1647427060118-4911c9821b82?auto=format&fit=crop&q=80&w=800",
    "photo-1581093458791": "https://images.unsplash.com/photo-1661882217431-b64b303fb1d0?auto=format&fit=crop&q=80&w=800",
    "photo-1581092918056": "https://images.unsplash.com/photo-1596552571892-2dda2c594670?auto=format&fit=crop&q=80&w=800",
    "photo-1478737270239": "https://images.unsplash.com/photo-1558317751-bc3ed6f85f72?auto=format&fit=crop&q=80&w=800",
    "photo-1522071823991": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
    "photo-1555616635":    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800",
    "photo-1558494949-ef010ccdcc32": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    "photo-1542332213":    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    "photo-1542744095":    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
    "photo-1560177112":    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
}

# ── Product-ID-specific overrides — wins over prefix matching ─────────────────
# Used when two products share the same broken prefix but need different fixes.
FIXES_BY_ID = {
    "projector-laser-5000":  "https://images.unsplash.com/photo-1579036095242-fe07594274ca?auto=format&fit=crop&q=80&w=800",
    "projector-laser-7000":  "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&q=80&w=800",
    "display-ultra-98-4k":   "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800",
    "display-flex-65-mobile": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
    "display-zero-75":       "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
    # Wrong-content fixes (not 404, but showed unrelated images)
    "tablet-rugged-stem":    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
    "workstation-it-mobile": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800",
    "laptop-hybrid-student": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
    "teacher-laptop-slim":   "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800",
    "av-rack-secure-server": "https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?auto=format&fit=crop&q=80&w=800",
    "cable-management-pkg-av": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800",
}

def get_fix(doc_id, image_url):
    """Return the correct URL if this product needs fixing, else None."""
    if doc_id in FIXES_BY_ID:
        correct = FIXES_BY_ID[doc_id]
        return correct if correct != image_url else None
    for prefix, correct_url in FIXES.items():
        if prefix in image_url:
            return correct_url
    return None

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    global access_token

    print("🔍 Reading all products from Firestore…")

    # Paginate through all products
    all_docs = []
    page_token = None
    while True:
        url = "products?pageSize=50"
        if page_token:
            url += f"&pageToken={page_token}"
        data = firestore_get(url)
        docs = data.get("documents", [])
        all_docs.extend(docs)
        page_token = data.get("nextPageToken")
        if not page_token:
            break

    print(f"   Found {len(all_docs)} products in Firestore\n")

    updated = 0
    skipped = 0
    errors  = 0

    for doc in all_docs:
        doc_name   = doc["name"]                        # full path
        doc_id     = doc_name.split("/")[-1]            # product id
        fields     = doc.get("fields", {})
        image_url  = fields.get("image", {}).get("stringValue", "")

        correct_url = get_fix(doc_id, image_url)
        if not correct_url:
            skipped += 1
            continue

        print(f"  ✏️  {doc_id}")
        print(f"      was : {image_url[-60:]}")
        print(f"      now : {correct_url[-60:]}")

        try:
            firestore_patch(f"products/{doc_id}", {"image": correct_url})
            print(f"      ✅ updated")
            updated += 1
            time.sleep(0.1)   # stay well under Firestore write limits
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if "UNAUTHENTICATED" in body or "invalid_grant" in body:
                print("  🔑 Token expired — refreshing…")
                access_token = refresh_access_token()
                # Retry once
                try:
                    firestore_patch(f"products/{doc_id}", {"image": correct_url})
                    print(f"      ✅ updated (after token refresh)")
                    updated += 1
                except Exception as e2:
                    print(f"      ❌ failed after refresh: {e2}")
                    errors += 1
            else:
                print(f"      ❌ HTTP {e.code}: {body[:200]}")
                errors += 1

    print(f"\n{'─'*50}")
    print(f"  Updated : {updated} products")
    print(f"  Skipped : {skipped} (already correct / custom URL)")
    print(f"  Errors  : {errors}")
    if errors == 0:
        print("  🎉 Firestore is now in sync with products.js")

if __name__ == "__main__":
    main()
