# Local Docker Deploy

Repo uruchamia lokalnie dwa elementy:

- frontend Vite zbudowany do statycznego SPA i serwowany przez `nginx` na `http://localhost:8080`
- self-hosted Supabase z Edge Functions na `http://localhost:54321`

Backend AI nie korzysta już z Lovable. Obie funkcje wywołują Gemini Direct przez OpenAI-compatible endpoint:

- `POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- `Authorization: Bearer $GEMINI_API_KEY`
- model domyślny `gemini-2.5-flash`

## Wymagania

- Docker Desktop z Compose
- minimum ok. 8 GB RAM dla pełnego stacku
- Node.js 20 do lokalnych komend `npm`
- ustawiony `GEMINI_API_KEY` w [infra/supabase/.env](./infra/supabase/.env:1)

## Start

1. Skopiuj frontend env:

```bash
cp .env.example .env.local
```

2. Uzupełnij `GEMINI_API_KEY` w [infra/supabase/.env](./infra/supabase/.env:1).
3. Zainstaluj zależności:

```bash
npm install
```

4. Uruchom cały stack:

```bash
docker compose up --build
```

Po starcie:

- frontend: `http://localhost:8080`
- Supabase API i Edge Functions: `http://localhost:54321`

Jeżeli port `8080` jest już zajęty, uruchom frontend na innym porcie hosta:

```bash
FRONTEND_PORT=18080 docker compose up --build
```

## Przydatne komendy

```bash
npm run lint
npm run test
npm run build
npm run docker:up
npm run docker:down
docker compose --profile ops up --build
```

Profil `ops` uruchamia Studio, analytics i vector. Domyślny start ogranicza się do usług wymaganych przez aplikację.

## Build samego frontendu

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=http://localhost:54321 \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJI... \
  --build-arg VITE_GEOCODER_URL=https://nominatim.openstreetmap.org/search \
  -t tauron-auditapp-frontend .
docker run --rm -p 8080:8080 tauron-auditapp-frontend
```

## Kontrakt środowiskowy

Frontend:

- `VITE_SUPABASE_URL=http://localhost:54321`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<lokalny anon key>`
- `VITE_GEOCODER_URL=https://nominatim.openstreetmap.org/search`

Edge Functions:

- `GEMINI_API_KEY=<klucz Google AI Studio>`
- `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- `AI_MODEL_LABEL=gemini-2.5-flash`
- `AI_MODEL_HOUSE=gemini-2.5-flash`

## Troubleshooting Gemini

JeĹĽeli Functions zwracajÄ… `503`, sprawdĹş czy host i kontenery Dockera poprawnie rozwiÄ…zujÄ… domenÄ™ Gemini:

```bash
Resolve-DnsName generativelanguage.googleapis.com
docker run --rm --network tauron-auditapp_default curlimages/curl:8.12.1 -I https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

Domena nie moĹĽe rozwiÄ…zywaÄ‡ siÄ™ do `0.0.0.0` ani `::`. JeĹ›li tak jest, problem leĹĽy w lokalnym DNS / filtracji sieci, a nie w kodzie aplikacji.
