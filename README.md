# A.S.D-Handbuch

Modernes Fullstack-Next.js-Projekt für das **Air Support Division Handbuch** eines GTA RP Police Departments.

## Projektstruktur

- `app/` – Next.js App Router, Seiten und Komponenten
- `app/api/` – API-Routen für Auth, Mitglieder, Training, Dienstzeiten, Handbuch und Uploads
- `app/components/` – wiederverwendbare UI-Komponenten
- `lib/` – Prisma-Client & Auth-Utilities
- `prisma/` – Datenmodell
- `public/` – statische Dateien, Manifest, Service Worker, Icons

## Funktionen

- Öffentlicher Handbuchbereich mit dynamischen Seiten
- Interner Adminbereich mit Login und Dashboard
- Mitgliederverwaltung mit Erstellung und Löschung
- Ausbildung & Trainingserfassung
- Dienstzeit-Erfassung mit Urlaubsoption
- Handbuch-Seiten erstellen und veröffentlichen
- Cloudinary-Upload-Endpunkt für Bildstoring
- PWA-Support mit `manifest.json` und Service Worker
- Dark-mode Admin/Dashboard-Design mit Orange-Akzenten

## Setup

1. Node.js installieren (`>=20` empfohlen)
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Umgebungsvariablen definieren:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   ADMIN_USER=asdadmin
   ADMIN_PASSWORD=asd-secret-password
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Prisma generieren und migrieren:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```
6. Öffne `http://localhost:3000`

## Deployment auf Vercel

1. Repository mit Vercel verbinden
2. Umgebungsvariablen in Vercel setzen:
   - `DATABASE_URL`
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Build-Befehl: `npm run build`
4. Ausgabeverzeichnis: `.`
5. Deployment starten

## Admin Login

- Benutzername: `asdadmin`
- Passwort: `asd-secret-password`

> Für Produktion sichere Umgebungsvariablen verwenden.
