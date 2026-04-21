# Dokumentacija projekta

## 1. Naziv projekta

| | |
|---|---|
| **Skladište ŠPAJZ** | Špajz — interni sistem skladišta |
| **Paket (npm)** | `projekatskladiste` |

Aplikacija služi za evidenciju artikala, kategorije, pregled stanja i osnovnu statistiku, s ulogama **korisnik** i **administrator**.

---

## 2. Opis projekta

### Cilj aplikacije

Centralizirano vođenje inventara (artikala u kategorijama), pregled i unos podataka o cijenama, te kontrola pristupa: novi korisnici se registruju, administrator ih odobrava, nakon čega korisnik može uključiti dvofaktorsku prijavu (MFA).

### Tehnologije

| Područje | Tehnologija |
|----------|-------------|
| Framework | **Next.js** 16 (App Router) |
| UI | **React** 19, **TypeScript** |
| Stil | **Tailwind CSS** 4, **shadcn/ui** (Base UI + CVA) |
| Grafikoni (statistika) | **Recharts** |

### Baza podataka

- **PostgreSQL** (konekcija preko `pg` drivera)

### ORM

- **Prisma** 7 (`@prisma/client`, Prisma Postgres adapter)

### Autentikacija

- **Prilagođena prijava** (nije NextAuth): lozinka hashirana s **bcryptjs**, sesija u **HTTP-only kolačiću** `auth_token` kao **JWT** (biblioteka **jose**, HS256).
- **MFA (dvofaktorska prijava)**: **TOTP** (autentifikator, QR kod) i opciono **email kod** ako je na serveru podešen **SMTP** (**Nodemailer**).
- **Pouzdani uređaj**: nakon MFA-a korisnik može označiti uređaj da se MFA preskoči na tom uređaju (poseban JWT u kolačiću).
- **OAuth / Google prijava**: *nije implementirana.*

### Glavne funkcionalnosti

- Registracija s osnovnim ličnim podacima (ime, prezime, telefon, JMBG) i čekanje odobrenja administratora.
- Prijava, MFA postavke, odjava.
- CRUD artikala (proizvoda) i kategorija: lista, detalji, novi unos, brisanje artikla.
- Filtriranje artikala (kategorija, cijena).
- Statistika / pregled brojeva (dashboard statistika).
- Admin: odobravanje korisnika, pregled korisnika skladišta (uključujući MFA status).


## 3. Funkcionalnosti aplikacije

Stvarno implementirane mogućnosti:

| Funkcionalnost | Status |
|----------------|--------|
| Registracija korisnika (email, lozinka, ime, prezime, telefon, JMBG) | Da |
| Prijava / odjava | Da |
| Google OAuth prijava | **Ne** |
| Pregled artikala (lista s filterima) | Da |
| Detalji jednog artikla | Da |
| Unos novog artikla | Da |
| Brisanje artikla (s detaljne stranice, s potvrdom) | Da |
| Kategorije artikala (+ dodavanje kategorije pri unosu) | Da |
| Korpa / checkout / plaćanje | **Ne** |
| Historija narudžbi | **Ne** |
| Korisnički profil (MFA postavke) | Da (`/profil/mfa`) |
| Recenzije / komentari | **Ne** |
| Admin panel (odobravanje, pregled korisnika) | Da |
| Statistika (pregled podataka u aplikaciji) | Da (`/statistika`) |

---

## 4. Pregled aplikacije

<img width="1446" height="513" alt="login register" src="https://github.com/user-attachments/assets/8842424a-ccff-4147-82fb-445ecaa1d839" />
<br><br>
<img width="555" height="438" alt="Screenshot_2" src="https://github.com/user-attachments/assets/adad4932-589f-44f8-8d13-8db3ff8eaa64" />
<br><br>
<img width="570" height="459" alt="2fa" src="https://github.com/user-attachments/assets/f7971621-8e0a-4e23-9f04-2b50c663d157" />
<br><br>
<img width="1252" height="902" alt="admindashboard" src="https://github.com/user-attachments/assets/41b8761f-fff2-46cf-93f4-23ce2148ce37" />
<br><br>
<img width="1468" height="910" alt="artikli" src="https://github.com/user-attachments/assets/ab66928d-ed5c-4704-a974-e6194f8f8952" />
<br><br>
<img width="549" height="604" alt="artikallll" src="https://github.com/user-attachments/assets/135fe317-931d-44db-8aa2-7cf33227eef7" />
<br><br>
<img width="679" height="481" alt="update" src="https://github.com/user-attachments/assets/50d42820-96ac-4899-b108-70d05e198074" />
<br><br>
<img width="1275" height="709" alt="odobravanje" src="https://github.com/user-attachments/assets/ccc4a06f-c465-4d68-8e34-01300b9f0e1a" />
<br><br>
<img width="681" height="743" alt="Screenshot_3" src="https://github.com/user-attachments/assets/6c0d1082-8bb6-4e34-9ee8-6734ebfa11b2" />
<br><br>
<img width="941" height="905" alt="qr kod" src="https://github.com/user-attachments/assets/1230e0a7-4f7c-4f3a-93b3-42e24b910556" />














### Korisnički dio (nakon prijave)

| Ruta | Opis |
|------|------|
| `/dashboard` | „Moj pregled” — prečice za artikle, statistiku itd. |
| `/profil/mfa` | Uključivanje/isključivanje TOTP ili email MFA, pouzdani uređaj |

### Admin (samo uloga ADMIN)

| Ruta | Opis |
|------|------|
| `/admin` | Odobravanje novih registracija (pregled imena, emaila, telefona, JMBG-a). |
| `/admin/dashboard` | Admin dashboard + pregled odobrenih korisnika skladišta. |

*Checkout, korpa, narudžbe, recenzije — nisu predviđeni u ovoj verziji.*

---

## 5. Admin panel

Implementirano:

### Dashboard (`/admin/dashboard`)

- Prečice prema odobravanjima, artiklima, statistici.
- Sekcija **korisnici s pristupom skladištu**: tablica s emailom, imenom i prezimenom, telefonom, JMBG-om, ulogom, MFA metodom, datumom registracije.

### Odobravanja (`/admin`)

- Lista korisnika koji čekaju odobrenje (svi podaci iz registracije vidljivi prije klika **Odobri**).

*Nema posebne „statistike prodaje/prihoda” kao u e-trgovini — fokus je na skladištu i korisnicima.*

---

## 6. Tehnologije korištene (sažetak)

- **Next.js** (App Router)
- **React**
- **TypeScript**
- **Prisma**
- **PostgreSQL** (`pg` + Prisma adapter)
- **jose** (JWT)
- **bcryptjs** (hash lozinki)
- **otplib** (TOTP)
- **Tailwind CSS** + **shadcn/ui** (komponente)
- **Vitest** (testovi)
- **Recharts** (statistika)

*Nije korišteno u projektu: NextAuth, Zod, React Hook Form, Uploadthing, Resend (direktno), Stripe/PayPal.*

---

## 7. Instalacija i pokretanje projekta

### Preduvjeti

- **Node.js** (LTS preporučen)
- **PostgreSQL** instanca i connection string

### Varijable okruženja

Kreiraj `.env` (ili koristi postojeći) s minimalno:

- `DATABASE_URL` — connection string za PostgreSQL
- `JWT_SECRET` — tajni ključ za potpis JWT sesije

Za seed admina (opciono): `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

Za email MFA: SMTP varijable prema `lib/mfa-mailer` / dokumentaciji projekta.

### Koraci

```bash
npm install
```

Migracije baze:

```bash
npx prisma migrate deploy
```

Ili u razvoju:

```bash
npx prisma migrate dev
```

Generiranje Prisma klijenta (često nakon `migrate`):

```bash
npx prisma generate
```

Seed (admin + demo podaci):

```bash
npm run db:seed
```

Pokretanje razvojnog servera:

```bash
npm run dev
```

Aplikacija je dostupna na:

**[http://localhost:3000](http://localhost:3000)**

*(Ako je port 3000 zauzet, Next.js može automatski koristiti 3001 — pogledaj ispis u terminalu.)*

### Ostale npm skripte

| Skripta | Opis |
|---------|------|
| `npm run build` | Produkcijski build |
| `npm run start` | Pokretanje produkcijskog servera (nakon `build`) |
| `npm run lint` | ESLint |
| `npm test` | Vitest testovi |
| `npm run db:migrate` | `prisma migrate deploy` (produkcija/CI) |

Alternativni menadžeri paketa: **yarn**, **pnpm**, **bun** — ekvivalentno `npm install` / `npm run dev`.

---

## 8. Deploy

U repozitoriju **nema fiksnog production URL-a**; deploy ovisi o tvom okruženju.

### Primjer: Vercel

1. Poveži Git repozitorij s [Vercel](https://vercel.com).
2. Postavi **environment variables** (`DATABASE_URL`, `JWT_SECRET`, SMTP ako treba).
3. Build command: `npm run build` (podrazumijevano za Next.js).
4. Za PostgreSQL često se koristi **Vercel Postgres**, **Neon**, **Supabase** ili vanjski host — `DATABASE_URL` mora biti dostupan iz Vercel okruženja.

### Baza na produkciji

- Pokreni migracije na produkcijskoj bazi: `npx prisma migrate deploy` (npr. u CI ili jednokratno pri deployu).

---

## Autor / napomena

U footeru aplikacije naveden je copyright vlasnika projekta (npr. Aldin Hodžić 2026 NTIP) — uskladi s produkcijskim brandingom po potrebi.

---

*Zadnje ažuriranje dokumentacije: u skladu sa stanjem koda u repozitoriju (Next.js 16, Prisma 7, PostgreSQL).*
