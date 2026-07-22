# TestFlight + canlı API

```
EAS Build (iOS) → TestFlight → iPhone
                      │
                      ▼
            EXPO_PUBLIC_API_URL
                      │
                      ▼
              Railway API + Postgres
```

## 1) Backend’i Railway’de ayağa kaldır

1. Railway → New Project → Postgres  
2. New Service → bu repo, **Root Directory: `backend`**  
3. Env: `DATABASE_URL`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CORS_ORIGIN=*`  
4. Deploy sonrası health: `https://<api>/health`  
5. Not: URL’yi Expo’ya yaz

## 2) Expo env / EAS secrets

```
EXPO_PUBLIC_API_URL=https://your-api.up.railway.app
EXPO_PUBLIC_AUTH_BYPASS=false
```

```bash
npx eas-cli secret:create --name EXPO_PUBLIC_API_URL --value "https://…" --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_AUTH_BYPASS --value "false" --scope project
```

## 3) TestFlight

```bash
npx eas-cli login
npx eas-cli init
npm run build:ios:testflight
npm run submit:ios:testflight
```

Apple Developer + App Store Connect’te Bundle ID: `com.kasa360.app`.
