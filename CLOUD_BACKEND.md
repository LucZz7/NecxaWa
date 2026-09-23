# NecxaWA Cloud Backend — phone se, bina PC ke (1-click)

PC nahi hai? Koi baat nahi. Ye repo **GitHub Codespaces** me 1 click me
backend chala deta hai — free GitHub account hi chahiye, aur sab kuch
phone ke browser se ho jayega.

## Shuru karo (phone se, ~5 minute)

**Step 1 — Codespace banao (1 tap):**

Apne phone ke browser me ye link kholo:

**https://codespaces.new/LucZz7/NecxaWa**

"Create codespace" dabao. 2-3 minute me cloud me ek machine taiyaar hogi
aur **backend khud start ho jayega** (API key terminal me print hogi).

**Step 2 — Port public karo:**

1. Codespace me neeche **PORTS** tab kholo
2. Port **2785** par tap karke **Port Visibility → Public** select karo
3. **Forwarded Address** copy karo — kuch aisa dikhega:
   `https://fancy-name-2785.app.github.dev`

**Step 3 — API key copy karo:**

Terminal me backend ne API key print ki hogi. Nahi dikhi to
`backend/.env` file kholo — `API_MASTER_KEY=` ke aage wali value hi key hai.

**Step 4 — Console connect karo:**

1. Console kholo: https://luczz7.github.io/NecxaWa/console.html
2. **Connection** tab me:
   - API base URL = Step 2 wala Forwarded Address
   - API key = Step 3 wali key
3. **Save & Test** dabao — green "Backend online" aana chahiye

**Step 5 — WhatsApp connect karo:**

1. **Sessions** tab → naam likh ke **Create** → **Start**
2. QR code aayega — apne phone ke **WhatsApp app** se scan karo
   (WhatsApp → Settings → Linked devices → Link a device)
3. Status **connected** hote hi **Send Message** se asli message bhejo. Ho gaya.

## Zaroori baatein (padh lo, 30 second)

- **Free quota:** Codespaces har mahine limited free hours deta hai.
  Jab use karna ho tab codespace **Start** karo, kaam khatm ho to **Stop**
  kar do — 24/7 chalane ke liye nahi hai.
- **Idle timeout:** 30 minute kuch na karo to codespace khud band ho
  jata hai. Dobara Start dabane par backend **khud wapas chalu** ho jata hai
  (API key wahi rehti hai, `backend/.env` me saved hai).
- **Session yaad rehta hai:** WhatsApp pairing `openwa-data` volume me
  save hoti hai — codespace restart par dobara QR scan nahi karna padega
  (jab tak volume delete na ho).
- **URL badal sakta hai:** Codespace rebuild karne par Forwarded Address
  naya mil sakta hai — console me URL update kar dena.
- **Hamesha-on chahiye to:** koi VPS (jaise Oracle Cloud ka Always Free
  tier) lo aur us par `backend/` folder wala setup chalao.

## Problem aaye to

- **"Backend online" nahi aa raha:** check karo port 2785 **Public** hai
  (Private par browser connect nahi hoga), aur URL me `https://` hai.
- **Terminal me key nahi dikhi:** `backend/.env` file kholo.
- **Codespace start nahi ho raha / quota khatm:** GitHub settings →
  Codespaces me usage dekho; agle mahine quota reset hota hai.
