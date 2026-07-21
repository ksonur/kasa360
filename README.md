# Kasa360

Çapraz platform kişisel finans uygulaması: **Expo** + **Railway API** + **PostgreSQL**.

## Dokümantasyon
- [STACK.md](STACK.md) — Mimari, env, Railway
- [PUBLISH.md](PUBLISH.md) — TestFlight + API URL
- [PRD.md](PRD.md) · [DATABASE.md](DATABASE.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [ROADMAP.md](ROADMAP.md) · [CLAUDE.md](CLAUDE.md)

## Çalıştırma (yerel)
1. `backend/`: `.env` + `npm run migrate` + `npm run dev`
2. Uygulama: `.env` → `EXPO_PUBLIC_API_URL=http://localhost:3000`, `EXPO_PUBLIC_AUTH_BYPASS=false`
3. `npm install` && `npm start`

## Hosting
- API + DB → Railway (`backend/`)
- iPhone → EAS TestFlight (`EXPO_PUBLIC_API_URL` = Railway URL)

Faz 2: aile/hane workspace paylaşımı ve e-posta ile ekstre/harcama çıkarımı.
