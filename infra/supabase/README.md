# Local Supabase Runtime

Ta konfiguracja bazuje na oficjalnym self-hosted Docker Compose Supabase, ale domyślnie uruchamia tylko komponenty potrzebne tej aplikacji.

## Domyślnie uruchamiane

- `kong`
- `auth`
- `rest`
- `realtime`
- `storage`
- `imgproxy`
- `meta`
- `functions`
- `db`
- `supavisor`

## Profil `ops`

Usługi operacyjne są pod profilem `ops`:

- `studio`
- `analytics`
- `vector`

Uruchomienie:

```bash
docker compose --profile ops up --build
```

## Gemini Direct

Ustaw w [`.env`](./.env:1):

- `GEMINI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL_LABEL`
- `AI_MODEL_HOUSE`
