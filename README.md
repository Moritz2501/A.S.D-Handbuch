# A.S.D-Handbuch

Modernes Fullstack-Next.js-Projekt für das **Air Support Division Handbuch** eines GTA RP Police Departments.

## Projektstruktur

- `app/` – Next.js App Router mit öffentlichen und internen Seiten
- `app/api/` – API-Routen für:
  - **Auth**: Login, Logout, Status-Checks
  - **Members**: Verwaltung, Beförderungen
  - **Training**: Erfassung, Management
  - **Duty Times**: Dienstzeit-Erfassung
  - **Flight Checks**: Flug-/Wartungschecks
  - **Handbook**: Seiten-Management
  - **Upload**: Bildverwaltung (Cloudinary)
- `app/components/` – wiederverwendbare UI-Komponenten (Navbar, Footer, InfoCard, etc.)
- `app/handbook/` – öffentliche Handbuch-Seiten mit dynamischen Routen
- `app/internal/` – Admin-Bereich (geschützte Seiten, Dashboard, Login-Formular)
- `lib/` – Auth-Utilities & Prisma-Client
- `prisma/` – Datenmodell mit Migrationen
- `public/` – PWA-Assets (Manifest, Service Worker, Icons)

## Funktionen

### Öffentlicher Bereich
- Dynamisches Handbuch mit Seiten-Management
- Responsive Navigation & Footer

### Admin-Dashboard (geschützt)
- **Mitgliederverwaltung**: Erstellen, Löschen, Beförderungen
- **Training**: Erfassung & Management neuer Trainings
- **Dienstzeiten**: Erfassung mit Urlaubsoptionen
- **Flight Checks**: Wartungs- / Flugchecks-Verwaltung
- **Handbuch-Pages**: Erstellen, Bearbeiten & Veröffentlichen
- **Bild-Upload**: Cloudinary-Integration für Medien

### Technologie
- PWA-Support mit `manifest.json` und Service Worker
- Dark-Mode Design mit Orange-Akzenten (#ff6600)
- Responsive Tailwind CSS Design
- TypeScript für Typsicherheit

## Setup & Installation

1. **Node.js installieren** (`>=20` empfohlen)
   
2. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren** (`.env.local`):
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/dbname
   
   # Admin Credentials
   ADMIN_USER=asdadmin
   ADMIN_PASSWORD=asd-secret-password
   
   # Cloudinary (Bild-Upload)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Datenbank vorbereiten**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Entwicklungsserver starten**:
   ```bash
   npm run dev
   ```
   Server läuft unter `http://localhost:3000`

## Verfügbare NPM Scripts

```bash
npm run dev          # Entwicklungsserver
npm run build        # Production Build
npm start            # Produktionsserver starten
npm run lint         # ESLint ausführen
npm run prisma:generate   # Prisma Client neu generieren
npm run prisma:migrate    # Datenbank-Migrations durchführen
```

> **Wichtig**: Nach Änderungen in `prisma/schema.prisma` immer `npm run prisma:generate` ausführen.

## Deployment auf Vercel

1. Repository mit Vercel verbinden (`vercel.com`)
2. Umgebungsvariablen in Vercel-Dashboard setzen:
   - `DATABASE_URL`
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Automatisches Deployment nach Git Push

## Admin-Zugang

**Standardanmeldedaten** (in Produktion ändern):
- **Benutzer**: `asdadmin`
- **Passwort**: `asd-secret-password`

> ⚠️ Für Produktionsumgebungen unbedingt sichere Passwörter verwenden und über Umgebungsvariablen setzen.

## Technologie-Stack

- **Framework**: Next.js 15 (App Router)
- **Datenbank**: PostgreSQL + Prisma ORM  
- **Styling**: Tailwind CSS
- **Authentication**: Custom Session-basiert
- **Datenspeicher**: Cloudinary (Bilder)
- **PWA**: Service Worker + Web Manifest
- **Programmiersprache**: TypeScript
