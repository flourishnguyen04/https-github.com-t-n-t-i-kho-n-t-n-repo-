# WriteWise Antigravity Setup

Open this `writewise` folder as the project root.

## Install dependencies

```bash
npm run install:all
```

## Run the backend

```bash
npm run dev:server
```

The backend reads environment variables from `server/.env`.

## Run the frontend

```bash
npm run dev:client
```

The frontend reads `VITE_API_URL` from `client/.env`.

## Important files

- `client/.env.example`: frontend environment template
- `server/.env.example`: backend environment template
- `server/seed/healthContent.js`: learning content
- `server/seed/seed.js`: database seed script

## Git notes

This folder is initialized as a Git repository. The `.gitignore` file excludes generated and sensitive files such as:

- `node_modules/`
- `client/dist/`
- `.env`
- `.DS_Store`
