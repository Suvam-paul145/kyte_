# Kyte CLI

A simple TypeScript CLI + web verification flow using Commander, Express, and Supabase Google login.

## Quick start

```bash
npm install
npm install --prefix backend
```

Create backend env:

```bash
copy backend\.env.example backend\.env
```

Set frontend env in `.env`:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_API_BASE_URL="http://localhost:4000"
```

## Run services

Terminal 1:

```bash
npm run backend:dev
```

Terminal 2:

```bash
npm run dev
```

Terminal 3:

```bash
npm run cli:dev -- login
```

Terminal 4 (CLI demo check):

```bash
npm run cli:test
```

## CLI usage

Login flow:

```bash
kyte login
```

Task command:

```bash
kyte "create express server"
```

Local (without global install):

```bash
npm run cli:dev -- "create express server"
```

## Root scripts

- `npm run dev` - Run the website (Vite)
- `npm run build` - Build TypeScript into `dist/`
- `npm run start` - Run the built CLI from `dist/index.js`
- `npm run cli:dev` - Run CLI from TypeScript source
- `npm run cli:test` - Print CLI test/demo status
- `npm run web:dev` - Run Vite frontend
- `npm run backend:dev` - Run Express backend
