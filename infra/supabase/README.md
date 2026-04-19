# Local Supabase Runtime

Ta konfiguracja bazuje na oficjalnym self-hosted Docker Compose Supabase, ale domyslnie uruchamia tylko komponenty potrzebne tej aplikacji.

## Domyslnie uruchamiane

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

Uslugi operacyjne sa pod profilem `ops`:

- `studio`
- `analytics`
- `vector`

Uruchomienie:

```bash
docker compose --profile ops up --build
```

## Deployment Env

Stala konfiguracja stacku jest w [deployment.env](./deployment.env:1).

Do zwyklego deploymentu musisz podac tylko rootowy `GEMINI_API_KEY`, np. przez `/.env` utworzony z [deployment.env.example](/C:/Users/Komputer/PycharmProjects/tauron_auditapp_hackaton/deployment.env.example:1).
