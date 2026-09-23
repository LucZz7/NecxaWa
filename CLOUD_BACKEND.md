# NecxaWA Cloud Backend — phone se, bina PC ke (1-click)

PC nahi hai? Koi baat nahi. Ye repo **GitHub Codespaces** me 1 click me
backend chala deta hai — free GitHub account hi chahiye, aur sab kuch
phone ke browser se ho jayega.

## Shuru karo (phone se)

**Step 1 — Codespace banao (1 tap):**

Apne phone ke browser me ye link kholo:

**https://codespaces.new/LucZz7/NecxaWa**

"Create codespace" dabao. Pehli baar **5-10 minute** lagenge — cloud me
backend ka poora setup (Chromium + engine + build) khud ho raha hoga.
"Setting up your codespace" dikhega, ghabrana nahi.

> Agar tumhara purana codespace **recovery mode** me atka hai to use
> delete kar do: **github.com/codespaces** kholo → codespace ke `...`
> → **Delete** → phir upar wali link se naya banao.

**Step 2 — API key copy karo (bina terminal):**

1. Left **Explorer** me **`.backend`** folder kholo
   (`.devcontainer` jaisa hi, dot se shuru hota hai)
2. Usme **`.env`** file kholo
3. `API_MASTER_KEY=` ke aage wali lambi key copy karo

**Step 3 — Port public karo:**

1. Neeche **PORTS** tab kholo
2. Port **2785** par tap karke **Port Visibility → Public** select karo
3. **Forwarded Address** copy karo — kuch aisa dikhega:
   `https://fancy-name-2785.app.github.dev`

**Step 4 — Console connect karo (1 tap + key paste):**

1. Ye link kholo — `?api=` me apna Forwarded Address lagana:
   `https://luczz7.github.io/NecxaWa/console.html?api=`**`TUMHARA-FORWARDED-ADDRESS`**
   (jaise `...console.html?api=https://fancy-name-2785.app.github.dev`)
   → URL khud bhar jayega
2. **API key** wale box me Step 2 wali key paste karo
3. **Save & Test** dabao → green "Backend online" aana chahiye

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
  (API key wahi rehti hai, `.backend/.env` me saved hai).
- **Session yaad rehta hai:** WhatsApp pairing `.backend/openwa-src/data`
  me save hoti hai — restart par dobara QR scan nahi karna padega.
- **URL badal sakta hai:** Codespace rebuild karne par Forwarded Address
  naya mil sakta hai — console me URL update kar dena.
- **Hamesha-on chahiye to:** koi VPS (jaise Oracle Cloud ka Always Free
  tier) lo aur us par `backend/` folder wala setup chalao.

## Problem aaye to

- **Codespace recovery mode me atak gaya:** github.com/codespaces se
  delete karke naya banao (Step 1 wala note dekho).
- **"Backend online" nahi aa raha:** check karo port 2785 **Public** hai
  (Private par browser connect nahi hoga), aur URL me `https://` hai.
- **Terminal me key dekhni ho:** terminal kholo — backend start hote
  waqt key wahan print hoti hai. Ya `.backend/.env` file kholo.
- **Codespace start nahi ho raha / quota khatm:** GitHub settings →
  Codespaces me usage dekho; agle mahine quota reset hota hai.
