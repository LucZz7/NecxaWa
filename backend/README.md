# NecxaWA backend — 1 command me chalu karo

Ye folder OpenWA ka **asli backend** (WhatsApp gateway engine) chalata hai.
Console (website) sirf remote hai — engine ye hai.

## Sabse aasan tarika — Docker (2 minute)

**Chahiye:** Docker Desktop / Docker Engine

**Linux / Mac:**
```bash
cd backend
bash start.sh
```

**Windows:**
```
backend folder kholo > start.bat par double-click
```

`start.sh` / `start.bat` khud karega:
1. Pehli baar ek strong API key banayega (`.env` me save)
2. `docker compose up -d` se backend start karega
3. Tumhe **Backend URL** aur **API key** print karke dega

Phir:
1. Console kholo: https://luczz7.github.io/NecxaWa/console.html
2. **Connection** me Backend URL + API key daal ke **Test Connection** dabao
3. **Sessions** me naam likh ke **Create** karo → **Start** dabao
4. QR aayega — apne phone ke WhatsApp se scan karo
5. Ho gaya. Ab **Send Message** se asli message jayega.

## Bina Docker ke — Node.js (advanced)

**Chahiye:** Node.js 22+ , Git

```bash
cd backend
bash setup-node.sh
```

Ye script khud karega: repo clone → dependencies → WhatsApp patches →
build → server start (`http://localhost:2785`).

> Note: kuch systems par `better-sqlite3` ka native compile `fchown`
> permission error de sakta hai. `setup-node.sh` uska fix bhi khud
> lagata hai (Node headers pre-cache karke).

## API key kahan hai?

`backend/.env` file me `API_MASTER_KEY=` ke aage. Ye key console me
dalni hai. **Kisi ko mat bhejo, public me mat daalo.**

## Band / restart karna ho

```bash
cd backend
docker compose down      # band
docker compose up -d      # wapas chalu
docker compose logs -f   # logs dekhna
```

## 24/7 chalana hai?

- **Apna PC:** jab tak PC on hai, backend chalega.
- **Hamesha on:** koi VPS/server lo (Oracle Cloud ka Always Free tier
  check kar sakte ho — free me milta hai), us par yehi `backend/`
  folder chala do. Phir console me us server ka URL daal do.

## Zaroori chetavni

- OpenWA unofficial WhatsApp automation hai (official WhatsApp API nahi).
- Bulk/spam messaging se tumhara **number ban ho sakta hai**.
- Sirf apne consented contacts ko message bhejo.
