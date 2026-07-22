# Kasa360 — Stack (Supabase’siz)

## Mimari

```
iPhone / Expo
    │  HTTPS  EXPO_PUBLIC_API_URL
    ▼
Railway: kasa360-api (Node + Hono)   ← istekleri cevaplar
    │
    ▼
Railway PostgreSQL                   ← DATABASE_URL
```

OTP mail: API → SMTP (`SMTP_*` env).

| Parça | Nerede |
|--------|--------|
| Mobil UI | Expo → TestFlight / EAS |
| HTTP API | **Railway** (`backend/`) |
| PostgreSQL | **Railway Postgres** |
| Auth | API: `/auth/otp/*` + JWT |

Supabase kullanılmaz.

## Yerel geliştirme

```bash
# 1) Postgres (Docker veya Railway local proxy)
# 2) backend
cd backend
cp .env.example .env   # DATABASE_URL, JWT_SECRET, SMTP_*
npm install
npm run migrate
npm run dev

# 3) uygulama
cd ..
# .env: EXPO_PUBLIC_API_URL=http://localhost:3000
# iOS simülatör: localhost OK; fiziksel cihaz: bilgisayarın LAN IP’si
npm start
```

## Railway deploy

1. Railway project → **Postgres** eklentisi  
2. Aynı project → **GitHub** `backend/` root olarak servis (Root Directory: `backend`)  
3. Variables: `DATABASE_URL` (Postgres’ten), `JWT_SECRET`, `SMTP_*`, `PORT`  
4. Deploy → `npm run migrate && npm run start`  
5. Public URL → Expo `EXPO_PUBLIC_API_URL` + EAS secrets  

Detaylı TestFlight: [PUBLISH.md](PUBLISH.md)
