# Tauron Audit App

Lokalny stack działa w Dockerze i składa się z:

- frontendu Vite na `http://localhost:8080`
- self-hosted Supabase API na `http://localhost:54321`
- Edge Functions uruchamianych lokalnie w `supabase/functions`
- publicznego geocodera Nominatim
- Gemini Direct przez OpenAI-compatible endpoint

## Model API

Edge Functions używają:

- endpointu `POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- nagłówka `Authorization: Bearer $GEMINI_API_KEY`
- modelu `gemini-2.5-flash`

Konfiguracja znajduje się w [infra/supabase/.env](./infra/supabase/.env:1).

## Start

1. Ustaw `GEMINI_API_KEY` w [infra/supabase/.env](./infra/supabase/.env:44).
2. Uruchom `npm install`.
3. Uruchom `docker compose up --build`.

Po starcie:

- frontend: `http://localhost:8080`
- Supabase API / Functions: `http://localhost:54321`

Jeżeli `8080` jest zajęty przez inny proces lub kontener, uruchom frontend na innym porcie hosta:

```bash
FRONTEND_PORT=18080 docker compose up --build
```

## Frontend env

Dla lokalnego developmentu poza Dockerem użyj [`.env.example`](./.env.example:1):

```bash
cp .env.example .env.local
```

## Przydatne komendy

- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run docker:up`
- `npm run docker:down`

## Supabase infra

- Lokalna konfiguracja runtime: [infra/supabase/.env](./infra/supabase/.env:1)
- Compose self-hosted: [infra/supabase/docker-compose.yml](./infra/supabase/docker-compose.yml:1)
- Oficjalny upstream reference: [infra/supabase/README.official.md](./infra/supabase/README.official.md:1)

Studio, analytics i vector są przeniesione do profilu `ops`, więc domyślne `docker compose up --build` startuje tylko to, czego potrzebuje aplikacja. Jeśli chcesz dołożyć komponenty operacyjne, uruchom:

```bash
docker compose --profile ops up --build
```

## Troubleshooting Gemini

JeĹĽeli Functions zwracajÄ… `503`, sprawdĹş czy host i kontenery Dockera poprawnie rozwiÄ…zujÄ… domenÄ™ Gemini:

```bash
Resolve-DnsName generativelanguage.googleapis.com
docker run --rm --network tauron-auditapp_default curlimages/curl:8.12.1 -I https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

Domena nie moĹĽe rozwiÄ…zywaÄ‡ siÄ™ do `0.0.0.0` ani `::`. JeĹ›li tak jest, problem leĹĽy w lokalnym DNS / filtracji sieci, a nie w kodzie aplikacji.
