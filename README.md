# Tauron Audit App

Lokalny stack sklada sie z:

- frontendu Vite na `http://localhost:8080`
- self-hosted Supabase API na `http://localhost:54321`
- Edge Functions z `supabase/functions`
- publicznego geocodera Nominatim
- Gemini Direct przez OpenAI-compatible endpoint

## Model API

Edge Functions uzywaja:

- `POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- `Authorization: Bearer $GEMINI_API_KEY`
- modelu `gemini-2.5-flash`

Stala konfiguracja self-hosted Supabase jest w [infra/supabase/deployment.env](./infra/supabase/deployment.env:1).

## Start

1. Skopiuj [deployment.env.example](./deployment.env.example:1) do lokalnego `/.env`.
2. Ustaw w `/.env` tylko `GEMINI_API_KEY`.
3. Uruchom `npm install`.
4. Uruchom `docker compose up --build`.

Po starcie:

- frontend: `http://localhost:8080`
- Supabase API / Functions: `http://localhost:54321`

Jesli `8080` jest zajety, uruchom frontend na innym porcie hosta:

```bash
FRONTEND_PORT=18080 docker compose up --build
```

## Jakie env dodac

Do Docker deploymentu potrzebujesz tylko:

- `/.env`
  - `GEMINI_API_KEY=<twoj klucz Google AI Studio>`

Do lokalnego developmentu frontendu poza Dockerem opcjonalnie:

- `/.env.local`
  - `VITE_SUPABASE_URL=http://localhost:54321`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=<lokalny anon key z .env.example>`
  - `VITE_GEOCODER_URL=https://nominatim.openstreetmap.org/search`

Nie musisz tworzyc `/infra/supabase/.env` do zwyklego deploymentu. Wszystkie stale ustawienia stacku sa juz w [infra/supabase/deployment.env](./infra/supabase/deployment.env:1).

## Przydatne komendy

- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run docker:up`
- `npm run docker:down`

## Supabase Infra

- runtime config: [infra/supabase/deployment.env](./infra/supabase/deployment.env:1)
- compose: [infra/supabase/docker-compose.yml](./infra/supabase/docker-compose.yml:1)
- upstream reference: [infra/supabase/README.official.md](./infra/supabase/README.official.md:1)

Studio, analytics i vector sa pod profilem `ops`. Jesli ich potrzebujesz:

```bash
docker compose --profile ops up --build
```

## Troubleshooting Gemini

Jesli Functions zwracaja `503`, sprawdz DNS i egress z hosta oraz z sieci Dockera:

```bash
Resolve-DnsName generativelanguage.googleapis.com
docker run --rm --network tauron-auditapp_default curlimages/curl:8.12.1 -I https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

Domena nie moze rozwiazywac sie do `0.0.0.0` ani `::`.
