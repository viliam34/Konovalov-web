# Konovalov Web - Backend Server

Node.js backend server pre kontaktný formulár webovej stránky.

## Inštalácia

1. **Nainštalujte závislosti:**
   ```bash
   cd server
   npm install
   ```

2. **Nakonfigurujte email:**
   
   Skopírujte `.env.example` do `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Upravte `.env` súbor s vašimi údajmi:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=vas-email@gmail.com
   EMAIL_PASS=vase-app-heslo
   EMAIL_TO=archvizual.studio@gmail.com
   PORT=3000
   ```

3. **Pre Gmail - vytvorte App Password:**
   - Prejdite na [Google Account](https://myaccount.google.com/)
   - Security → 2-Step Verification (musí byť zapnuté)
   - App passwords → Vygenerujte nové heslo pre "Mail"
   - Toto heslo použite v `EMAIL_PASS`

## Spustenie

**Development mode (s auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server bude dostupný na `http://localhost:3000`

## API Endpoints

### POST /api/contact
Odoslanie kontaktného formulára.

**Body (multipart/form-data):**
- `name` - Meno odosielateľa (povinné)
- `email` - Email odosielateľa (povinné)
- `subject` - Predmet správy (povinné)
- `message` - Text správy (voliteľné)
- `attachment` - Prílohy (voliteľné, max 5 súborov, max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Vaša správa bola úspešne odoslaná!"
}
```

### GET /api/health
Kontrola stavu servera.

## Deployment

Pre produkčné nasadenie odporúčame:
- **Heroku** - jednoduché nasadenie Node.js aplikácií
- **DigitalOcean App Platform**
- **Railway.app**
- **Render.com**

Nezabudnite nastaviť environment premenné na produkčnom serveri.
