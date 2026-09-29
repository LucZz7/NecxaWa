# NecxaWA Cloud Backend — managed, zero setup

Tumhara NecxaWA backend **already cloud me chal raha hai** — managed by your
assistant. Koi codespace banane ki zaroorat nahi, koi terminal command nahi,
koi API key yaad rakhne ki zaroorat nahi.

## Tumhe kya karna hai (bas 2 cheez)

1. **Private access link kholo** — jo link tumhe diya gaya hai (usme `?t=...`
   laga hota hai). Console khulte hi relay connect ho jayega.
   Link kho gaya? Apne assistant se naya maang lo.
2. **WhatsApp connect karo** — Console me **Sessions** tab → naam likh ke
   **Create** → **Start** → QR aayega → apne phone ke WhatsApp se scan karo
   (WhatsApp → Settings → Linked devices → Link a device).
   Status **connected** hote hi **Send Message** se asli message bhejo.

**Ye link sirf tumhara hai — kisi ke saath share mat karna.** Jiske paas ye
link hai, woh tumhare WhatsApp backend ko chala sakta hai.

## Kaise kaam karta hai (technical)

- Backend: OpenWA REST API, assistant ke managed server pe (port 2785).
- Console (ye website) backend se ek **private relay channel** ke through
  baat karti hai. API key sirf server pe rehti hai, browser me kabhi nahi aati.
- Server har 5 minute me auto-check hota hai (watchdog) — band hua to khud
  wapas chalu ho jata hai.

## Purana codespace flow

Agar kabhi apna khud ka backend chalana ho (apne GitHub Codespace me), to
repo me `.devcontainer/` ab bhi maujood hai. Lekin zaroorat nahi: managed
backend hi use karo.
