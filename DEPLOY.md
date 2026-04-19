# Local Docker Deploy

Repo uruchamia lokalnie:

- frontend Vite serwowany przez `nginx` na `http://localhost:8080`
- self-hosted Supabase z Edge Functions na `http://localhost:54321`

Backend AI nie korzysta z Lovable. Obie funkcje wywoluja Gemini Direct:

- `POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- `Authorization: Bearer $GEMINI_API_KEY`
- model domyslny `gemini-2.5-flash`

## Wymagania

- Docker Desktop z Compose
- ok. 8 GB RAM dla pelnego stacku
- Node.js 20 do lokalnych komend `npm`
- rootowy `/.env` z `GEMINI_API_KEY`

## Start

1. Skopiuj [deployment.env.example](./deployment.env.example:1) do lokalnego `/.env`.
2. Ustaw `GEMINI_API_KEY`.
3. Uruchom:

```bash
npm install
docker compose up --build
```

Po starcie:

- frontend: `http://localhost:8080`
- Supabase API i Edge Functions: `http://localhost:54321`

Jesli port `8080` jest zajety:

```bash
FRONTEND_PORT=18080 docker compose up --build
```

## Kontrakt deploymentu

Do zwyklego deploymentu podajesz tylko:

- `GEMINI_API_KEY=<klucz Google AI Studio>`

Stala konfiguracja self-hosted Supabase jest juz osadzona w [infra/supabase/deployment.env](./infra/supabase/deployment.env:1).

## Przydatne komendy

```bash
npm run lint
npm run test
npm run build
npm run docker:up
npm run docker:down
docker compose --profile ops up --build
```

## Troubleshooting Gemini

Jesli Functions zwracaja `503`, sprawdz czy host i kontenery Dockera poprawnie rozwiazuja domeny Google:

```bash
Resolve-DnsName generativelanguage.googleapis.com
docker run --rm --network tauron-auditapp_default curlimages/curl:8.12.1 -I https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

Domena nie moze rozwiazywac sie do `0.0.0.0` ani `::`.
