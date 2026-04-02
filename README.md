# Maskindeling.no – Internt maskinsystem for Oslo kommune

Et internt system for deling av maskiner mellom kommunale virksomheter i Oslo.

**Teknologi:** Next.js 16 · TypeScript · Tailwind CSS · Neon Postgres · Drizzle ORM

---

## Innhold

- [Funksjonalitet](#funksjonalitet)
- [Mappestruktur](#mappestruktur)
- [Miljøvariabler](#miljøvariabler)
- [Kom i gang lokalt](#kom-i-gang-lokalt)
- [Sett opp Neon-database](#sett-opp-neon-database)
- [Kjør migrasjoner](#kjør-migrasjoner)
- [Seed testdata](#seed-testdata)
- [Deploy til Vercel](#deploy-til-vercel)
- [Testkontoer](#testkontoer)

---

## Funksjonalitet

- Innlogging med e-post og passord (JWT i httpOnly cookie)
- Dashboard med nøkkeltall og statusoversikt
- Maskinliste med søk og filter (type, status)
- Maskindetaljside med forespørselsskjema
- Forespørselsflyt: send → godkjenn / avslå
- Adminpanel: administrer maskiner, brukere og forespørsler
- Responsivt design med mobilnavigasjon
- Norsk språk gjennomgående

---

## Mappestruktur

```
maskindeling/
├── app/
│   ├── logg-inn/          # Innloggingsside
│   ├── dashboard/         # Hoveddashboard
│   ├── maskiner/          # Maskinliste + detaljside
│   │   └── [id]/
│   ├── foresporsler/      # Forespørselsoversikt
│   ├── admin/             # Adminpanel
│   │   ├── maskiner/
│   │   ├── brukere/
│   │   └── foresporsler/
│   └── api/               # API-ruter
│       ├── auth/
│       ├── maskiner/
│       ├── foresporsler/
│       ├── organisasjoner/
│       └── admin/
├── components/
│   ├── ui/                # Button, Badge, Card, Input, Select
│   └── layout/            # Navbar, MobileNav
├── lib/
│   ├── auth.ts            # JWT, bcrypt, session
│   └── db/
│       ├── index.ts       # Drizzle-klient
│       ├── schema.ts      # Database-skjema
│       └── migrations/    # SQL-migrasjoner
├── scripts/
│   └── seed.ts            # Testdata
├── middleware.ts           # Auth-middleware
├── drizzle.config.ts
└── .env.example
```

---

## Miljøvariabler

Kopier `.env.example` til `.env.local` og fyll inn verdiene:

```bash
cp .env.example .env.local
```

| Variabel               | Beskrivelse                                     | Eksempel                                      |
|------------------------|-------------------------------------------------|-----------------------------------------------|
| `DATABASE_URL`         | Neon Postgres connection string                 | `postgresql://...@...neon.tech/maskindeling?sslmode=require` |
| `JWT_SECRET`           | Hemmelig nøkkel for JWT-tokens (min. 32 tegn)  | `en-lang-og-tilfeldig-streng-her-123456`      |
| `NEXT_PUBLIC_BASE_URL` | Base-URL i produksjon (valgfritt)               | `https://maskindeling.no`                     |

---

## Kom i gang lokalt

### 1. Klon og installer avhengigheter

```bash
git clone <repo-url>
cd maskindeling
npm install
```

### 2. Sett opp miljøvariabler

```bash
cp .env.example .env.local
# Rediger .env.local med dine verdier
```

### 3. Sett opp database (se eget avsnitt nedenfor)

### 4. Kjør migrasjoner

```bash
npm run db:push
```

### 5. Seed testdata

```bash
npm run db:seed
```

### 6. Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

---

## Sett opp Neon-database

1. Gå til [neon.tech](https://neon.tech) og opprett en gratis konto
2. Klikk **New Project**
3. Gi prosjektet et navn, f.eks. `maskindeling`
4. Velg region nærmest deg (f.eks. `EU Central – Frankfurt`)
5. Klikk **Create project**
6. Kopier **Connection string** (formatet `postgresql://...`)
7. Lim inn i `DATABASE_URL` i `.env.local`

---

## Kjør migrasjoner

Drizzle Kit brukes for å synkronisere skjema til databasen.

### Alternativ A: Push direkte (anbefalt for MVP/dev)

Synkroniserer skjema direkte til databasen uten å generere migrasjonsfiler:

```bash
npm run db:push
```

### Alternativ B: Generer og kjør migrasjonsfiler

Genererer SQL-migrasjonsfiler i `lib/db/migrations/`:

```bash
npm run db:generate
npm run db:migrate
```

### Drizzle Studio (visuell databaseklient)

```bash
npm run db:studio
```

---

## Seed testdata

Fyller databasen med eksempeldata for Oslo kommune:

```bash
npm run db:seed
```

Dette oppretter:
- **Organisasjon:** Oslo kommune
- **Avdelinger:** Kirkelig fellesråd, Vann- og avløpsetaten, Bymiljøetaten
- **5 maskiner** med forskjellig status
- **4 brukere** (1 admin, 3 vanlige)
- **1 eksempelforespørsel**

> **Advarsel:** Kjør seed kun én gang mot en tom database. Kjører du den flere ganger oppstår duplikater.

---

## Deploy til Vercel

### 1. Push kode til GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Koble til Vercel

1. Gå til [vercel.com](https://vercel.com) og logg inn
2. Klikk **Add New → Project**
3. Importer GitHub-repoet ditt
4. Vercel oppdager Next.js automatisk – ingen byggeinnstillinger trengs

### 3. Legg til miljøvariabler i Vercel

Under **Settings → Environment Variables**, legg til:

| Navn                   | Verdi                              |
|------------------------|------------------------------------|
| `DATABASE_URL`         | Din Neon connection string         |
| `JWT_SECRET`           | En lang, tilfeldig hemmelig streng |
| `NEXT_PUBLIC_BASE_URL` | Din Vercel-URL, f.eks. `https://maskindeling.vercel.app` |

### 4. Deploy

Klikk **Deploy**. Vercel bygger og deployer automatisk.

### 5. Kjør seed i produksjon

Etter deploy, kjør seed lokalt mot prod-databasen (samme `DATABASE_URL`):

```bash
npm run db:seed
```

---

## Testkontoer

Etter seeding er følgende kontoer tilgjengelige:

| Rolle         | E-post                              | Passord    |
|---------------|-------------------------------------|------------|
| Administrator | `admin@oslo.kommune.no`             | `admin123` |
| Bruker (VAV)  | `bruker@vav.oslo.kommune.no`        | `bruker123`|
| Bruker (KF)   | `bruker@kf.oslo.kommune.no`         | `bruker123`|
| Bruker (Bymiljø) | `bruker@bymiljo.oslo.kommune.no` | `bruker123`|

**Viktig:** Endre passord i produksjon!

---

## Maskinstatuser

| Status        | Beskrivelse                          |
|---------------|--------------------------------------|
| `tilgjengelig`| Kan lånes av andre virksomheter      |
| `opptatt`     | Er i bruk, ikke tilgjengelig         |
| `på_service`  | Under service/vedlikehold            |
| `ute_av_drift`| Defekt eller avskrevet               |

## Forespørselstatuser

| Status    | Beskrivelse                        |
|-----------|------------------------------------|
| `sendt`   | Venter på behandling               |
| `godkjent`| Godkjent av ansvarlig avdeling     |
| `avslått` | Avslått av ansvarlig avdeling      |

---

## Videreutvikling (forslag)

- E-postvarsler ved nye forespørsler (Resend/Nodemailer)
- Kalenderintegrasjon for tilgjengelighetsperioder
- Bilder av maskiner
- Historikk / revisjonslogg
- SSO/Active Directory-integrasjon
- Eksport til Excel/PDF
