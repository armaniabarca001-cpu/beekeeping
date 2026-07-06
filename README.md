# HiveTracker

A responsive web app for beekeepers to manage apiaries, run guided hive inspections,
and track frame-level history over time. Langstroth hives only (8-frame and 10-frame).

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS v4 · Prisma 7 + Postgres · NextAuth
(Credentials + Google OAuth) · react-three-fiber/drei (3D hive builder) ·
react-leaflet + Esri World Imagery + OSM Nominatim (apiary satellite map, no API key needed)

## Getting started

```bash
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, Google keys, etc.
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo routes that don't require a
database or API keys to look at the 3D hive builder and map integration:

- `/hives/demo` - react-three-fiber hive stack (sample 2-deep + 1-medium-super hive)
- `/apiaries/demo` - satellite map view with a sample hive pin

## Deployment

Deployed on Railway (Next.js app + managed Postgres), source on GitHub.
