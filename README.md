# Elden Ring — Mega Checklist (MERN)

Application web pour les completionists d’Elden Ring: parcourir, filtrer et cocher les contenus du jeu (boss, grâces, talismans, etc.), avec import CSV/XLSX pour enrichir la base et mise à jour idempotente côté serveur. UI minimaliste sombre, TypeScript strict partout.

## stack
- backend: Node 18+, Express, Mongoose (MongoDB), Zod, JWT, CORS, TSX (runner)
- frontend: React 18 + Vite, Tailwind, React Query, Axios, React Router, Zustand, SheetJS (`xlsx`)
- base de données: MongoDB (docker-compose fourni)

## architecture
- monorepo pnpm: `packages/server` (API), `packages/web` (SPA)
- fichiers clés:
  - `packages/server/src/routes/items.ts`: `GET /items`, `POST /items/bulk-upsert` (admin)
  - `packages/server/src/schemas/items.ts`: `itemsQuerySchema`, `bulkUpsertSchema`
  - `packages/server/src/utils/slug.ts`: `slugifyUnique(title, exists)` avec suffixes `-2`, `-3`, …
  - `packages/server/src/index.ts`: bootstrap Express (`express.json({ limit: '5mb' })`)
  - `packages/server/scripts/seed.ts`: seed 3 items + user admin
  - `packages/web/src/components/ImportDialog.tsx`: parsing CSV/XLSX + aperçu + POST bulk-upsert
  - `docker-compose.yml`: service MongoDB local

## quickstart

```bash
cp .env.example .env
# lancez d'abord docker desktop (windows/mac)
pnpm db:up   # démarre mongodb (docker)
pnpm i
pnpm seed
pnpm dev
```

- api: http://localhost:4000
- web: http://localhost:5173
- test user: `test@local` / `test1234`

si vous n'avez pas docker, installez mongodb localement ou pointez `MONGODB_URI` vers une instance existante (atlas, etc.).

> astuce: si `docker compose` échoue avec "engine not running", ouvrez l'application docker desktop puis relancez `pnpm db:up`.

## fonctionnalités
- liste des items avec filtres (`category`, `region`, recherche `q`) et tri `{ category, region, title }`
- authentification (register/login), JWT 7j; seed crée un admin `test@local` / `test1234`
- import CSV/XLSX (SheetJS): mapping automatique des colonnes, aperçu (50 lignes), envoi vers API
- upsert en masse côté serveur (admin): validation Zod, slug unique stable, idempotent par slug
- UI sombre minimaliste, responsive

## scripts
- `pnpm dev` → lance server + web
- `pnpm build` → build des deux paquets
- `pnpm lint` → lint
- `pnpm seed` → insère 3 items + 1 user
- `pnpm db:up` / `pnpm db:down` → démarrer/arrêter MongoDB (docker)
- `pnpm db:logs` → logs Mongo

## endpoints principaux
- `GET /items` → query `category?`, `region?`, `q?` → liste d’items
- `POST /items/bulk-upsert` (admin) → body: tableau conforme à `bulkUpsertSchema` → `{ count, upserted: [{ slug, created }] }`
- `POST /auth/register`, `POST /auth/login` → JWT (7j), payload user minimal

## import csv/xlsx
- page `import` (protégée par login)
- formats supportés: `.csv`, `.tsv`, `.xlsx`, `.xls`
- colonnes recommandées: `title,category,subcategory,region,tags,prerequisites,weight,notes`
- `tags` / `prerequisites`: chaîne séparée par `,` → tableau
- `weight`: nombre strictement positif (défaut: 1)

exemple csv (3 lignes, avec un doublon):

```csv
title,category,region,tags,weight
Boss A,Boss,Limgrave,"field,boss",3
Grâce 1,Grâce,Limgrave,,1
Boss A,Boss,Limgrave,"field,boss",3
```

workflow:
- uploader le fichier → aperçu des 50 premières lignes
- cliquer “importer” → POST `/items/bulk-upsert` → `{ count, upserted[] }`

## outils conseillés
- Docker Desktop (pour MongoDB local via compose)
- MongoDB Compass (explorer la base)
- Postman/Insomnia (tester les endpoints)
- VS Code + extensions TypeScript/ESLint/Tailwind

## à venir (suggestions)
- mapping de colonnes configurable et feedback par ligne lors de l’import
- support complet `mapRef` (lat/lng/note) côté import + aperçu carto
- résumé d’import (créés vs mis à jour) dans l’UI
- gestion des rôles côté UI (promouvoir/dépromouvoir)
- tests (unitaires/API), CI lint/build
- durcissement auth/rate-limit, copies d’erreurs améliorées
