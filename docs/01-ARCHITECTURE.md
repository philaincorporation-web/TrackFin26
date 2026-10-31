# DIWAA Finance — Architecture proposée

> Statut : **décisions structurantes validées le 31/10/2026** (voir §9). Les points ⚠️ restants concernent des règles métier (A3, A6…) à confirmer.

## 1. Vue d'ensemble

```
Navigateur (mobile / desktop)
   │  RSC + Server Actions (formulaires RHF + Zod)
   ▼
Next.js 16 App Router ── proxy.ts (redirection si non connecté, contrôle optimiste uniquement)
   │
   ├── lib/auth        session → { userId, role }            Better Auth
   ├── lib/authz       can(user, action, ressource)  ← SEUL point de décision d'accès
   ├── lib/services/*  logique métier (dépenses, factures, paie…) toujours via authz
   ├── lib/audit       écriture append-only dans la même transaction
   ├── lib/storage     URL signées d'upload/lecture (Cloudflare R2 privé)
   ├── lib/pdf         factures, reçus, bulletins, rapports (@react-pdf/renderer)
   └── lib/db          Prisma Client (adapter Neon serverless)
   ▼
PostgreSQL (Neon) : branches dev / preview / prod
   ▲
Tâche planifiée quotidienne (cron) → /api/cron/alerts (protégée par secret) → notifications idempotentes
```

**Règle d'or** : les pages et les actions n'accèdent jamais à Prisma directement. Elles appellent un service qui (1) vérifie `can()`, (2) valide l'entrée avec Zod, (3) exécute dans une transaction, (4) écrit l'audit. Masquer un bouton côté interface est de l'ergonomie, pas de la sécurité.

## 2. Arborescence cible

```
my-app/
  app/
    (auth)/connexion/
    (app)/                      layout avec sidebar + session
      tableau-de-bord/
      depenses/  [id]/  nouvelle/  verification/
      factures/  [id]/  nouvelle/
      tresorerie/
      rapports/
      personnel/  [id]/  paie/[periode]/
      mes-bulletins/
      notifications/
      historique/
      parametres/   (entreprise, catégories, primes, alertes, utilisateurs)
    api/
      cron/alerts/route.ts
      files/[id]/route.ts       redirection vers une URL signée après contrôle can()
      pdf/[type]/[id]/route.ts
  lib/  auth/ authz/ services/ validation/ audit/ storage/ pdf/ money/ db/
  prisma/  schema.prisma  migrations/  seed-demo.ts
  tests/   unit/ integration/ e2e/
  docs/
  proxy.ts
```

## 3. Rôles et permissions (matrice bêta)

L = lire · C = créer · M = modifier · A = annoter · ✓ = action autorisée · (own) = uniquement ses propres objets

| Ressource / action | Directrice | Admin général | Secrétaire | Collaborateur |
|---|---|---|---|---|
| Tableau de bord global | L | L | L (vue opérationnelle) | ✗ |
| Dépense : créer / soumettre | ✗ | ✗ | C (au nom de l'entreprise) | C (own) |
| Dépense : lire | L tout | L tout | L tout | L (own) |
| Dépense : valider / demander une précision / rejeter | ✗ | ✗ | ✓ | ✗ |
| Dépense : confirmation facultative | ✗ | ✓ (non bloquante) | ✗ | ✗ |
| Dépense : comptabiliser | ✗ | ✗ | ✓ | ✗ |
| Justificatif : lire | ✓ | ✓ | ✓ | (own) |
| Justificatif : ajouter une pièce complémentaire | ✗ | ✗ | ✓ | (own, si précision demandée) |
| Annotations | A | A | A | A (own) |
| Factures et encaissements | L | L | C / M / annuler | ✗ |
| Trésorerie déclarée | L | L | M (si droit accordé) | ✗ |
| Rapports PDF | L | L | L | ✗ |
| Fiches collaborateurs | L | L | C / M | ✗ |
| Paie : préparer | ✗ | ✗ | ✓ | ✗ |
| Paie : valider un bulletin | ✓ ⚠️ A3 | ✓ ⚠️ A3 | ✗ | ✗ |
| Versements de salaire | L | L | C | ✗ |
| Mes bulletins | own | own | own | own (si portail activé) |
| Historique / audit | L | L | L | ✗ |
| Paramètres et utilisateurs | L | ✓ | ✗ | ✗ |
| Notifications | ✓ | ✓ | ✓ | ✓ (ses dossiers) |

La matrice sera codée **une seule fois** dans `lib/authz/policy.ts` et testée ligne par ligne.

## 4. Modèle de données (esquisse Prisma)

Montants : `BigInt` en unités XAF entières (aucun flottant). Une seule devise active, stockée sur chaque document financier.

```prisma
enum Role { DIRECTRICE ADMIN SECRETAIRE COLLABORATEUR }

model User            { id, email @unique, name, role Role, active Boolean, employee Employee?, createdAt }
model CompanySettings { id (singleton), legalName, address, phone, email, rccm?, nif?, bankDetails?,
                        logoFileId?, currency "XAF", invoicePrefix "FAC", invoicePadding 3,
                        payrollPortalEnabled false,                         reminderDaysBeforeDue?, treasuryLowThreshold?, legalPayrollRulesValidated false }

model StoredFile      { id, storageKey @unique, originalName, mimeType, size, sha256, uploadedById, createdAt }
                        // jamais modifié et jamais supprimé physiquement pendant la durée de conservation

// ---- Dépenses
enum ExpenseStatus    { BROUILLON SOUMISE PRECISION_DEMANDEE VALIDEE COMPTABILISEE REJETEE }
model ExpenseCategory { id, name @unique, active }
model Project         { id, name, kind (PROJET|FORMATION|MISSION), active }
model Expense         { id, reference @unique, declarantId, expenseDate, categoryId, amount BigInt, currency,
                        supplier, reason, projectId?, paymentMethod?, comment?, status ExpenseStatus,
                        rejectionReason?, adminConfirmedById?, adminConfirmedAt?,
                        submittedAt?, validatedAt?, postedAt?, createdAt, updatedAt }
model ExpenseAttachment { id, expenseId, fileId, addedById, createdAt }
model ExpenseStatusChange { id, expenseId, from?, to, actorId, note?, at }  // historique du circuit

// ---- Factures
enum InvoiceState     { BROUILLON EMISE ANNULEE }   // stocké. Paiement et retard sont calculés (A5)
model Client          { id, name, address?, email?, phone?, taxId? }
model InvoiceCounter  { series, year, last Int, @@id([series, year]) }
model Invoice         { id, number String? @unique, clientId, clientSnapshot Json, issueDate?, dueDate?,
                        state InvoiceState, total BigInt, currency, paymentTerms?, cancelReason?,
                        createdById, issuedAt?, cancelledAt? }
model InvoiceLine     { id, invoiceId, position, label, quantity Decimal?, unitPrice BigInt?, amount BigInt }
model InvoicePayment  { id, invoiceId, amount BigInt, paidAt, method, reference?, fileId?, recordedById, createdAt }

// ---- Annotations
enum ThreadState      { PUBLIEE REPONSE_ATTENDUE REPONDUE DOCUMENT_DEMANDE RESOLUE }
model CommentThread   { id, targetType (EXPENSE|INVOICE|FILE), targetId, state ThreadState, createdById, createdAt }
model Comment         { id, threadId, authorId, body, fileId?, createdAt }   // jamais modifié, seulement ajouté

// ---- Trésorerie
model TreasurySnapshot { id, amount BigInt, breakdown Json?, asOf DateTime, comment?, authorId, createdAt }

// ---- Paie
model Employee        { id, userId? @unique, fullName, position, contractType, startDate, baseSalary BigInt, active }
model PayItemType     { id, kind (PRIME|INDEMNITE|RETENUE), name, requiresProject Boolean, active }
enum PayslipState     { BROUILLON A_VALIDER VALIDE ARCHIVE }
model Payslip         { id, employeeId, period "2026-10", state PayslipState, baseSalary BigInt,
                        gross BigInt, deductions BigInt, net BigInt, preparedById, validatedById?, validatedAt?,
                        fileId?, @@unique([employeeId, period]) }
model PayslipItem     { id, payslipId, typeId?, label, amount BigInt (signé), projectId?, itemDate?, reason? }
model SalaryPayment   { id, employeeId, amount BigInt, paidAt, kind (VERSEMENT|AVANCE), method, reference?,
                        comment?, recordedById, createdAt }
// Arriérés : AUCUNE table. Calcul déterministe (voir §5).

// ---- Notifications et audit
model Notification    { id, userId, type, title, body, link, dedupeKey, readAt?, createdAt,
                        @@unique([userId, dedupeKey]) }
model AuditEvent      { id BigInt @id, at, actorId?, action, entityType, entityId, before Json?, after Json?, ip? }
                        // aucun UPDATE ni DELETE autorisé (rôle SQL dédié et/ou trigger de blocage)
```

## 5. Règles de calcul clés

**Facture** : `encaissé = Σ paiements` ; `reste = total − encaissé` (un paiement qui dépasse le reste est refusé). Statut affiché : `ANNULEE` > `PAYEE` (reste = 0) > `EN_RETARD` (échéance dépassée) > `PARTIELLEMENT_PAYEE` > `EN_ATTENTE`.

**Numérotation** (transaction) :
```sql
INSERT INTO "InvoiceCounter"(series, year, last) VALUES ('FAC', 2026, 1)
ON CONFLICT (series, year) DO UPDATE SET last = "InvoiceCounter".last + 1 RETURNING last;
```
Le changement d'année est géré naturellement, et `@unique` sur `number` sert de filet de sécurité.

**Paie et arriérés** : pour un collaborateur et un mois M :
- `dû_courant(M)` = net du bulletin **validé** de M
- `arriéré_antérieur(M)` = Σ nets validés des mois < M − Σ versements imputés sur ces mois (FIFO, A8)
- `reste(M)` = `arriéré_antérieur(M) + dû_courant(M) − versements imputés à M`

Rien n'est copié d'un mois à l'autre : le report est une **vue calculée**, ce qui rend le double comptage impossible par construction. Ce calcul est couvert par des tests unitaires.

**Solde de gestion** ✅ A7 validé : `encaissements(période) − dépenses comptabilisées(période)`, **hors salaires** (les salaires versés sont affichés dans un indicateur séparé). La formule est affichée en infobulle avec la mention « indicateur de pilotage, pas un résultat comptable ».

## 6. Alertes

Un cron quotidien (06:00 Africa/Libreville) appelle `/api/cron/alerts` avec un secret. Chaque règle produit des notifications avec une `dedupeKey` (ex. `invoice-overdue-7:{invoiceId}`). La contrainte unique empêche les doublons, même si le cron s'exécute deux fois. Règles : impayé à J+7, dépense non traitée depuis 3 jours, rappel avant échéance (si paramétré), observation sans réponse, arriéré de salaire, trésorerie sous le seuil (si paramétré).

## 7. UI / design system

- Inspiration de la maquette fournie : sidebar blanche arrondie, cartes KPI à coins larges, carte principale pleine couleur, graphiques en barres.
- Couleurs issues du logo DigiWomen School : **vert** `#2E8B22` (primaire, rôle de la carte « Total » de la maquette) et **indigo** `#3B17B8` (accent). Neutres zinc. Vert et rouge pour les variations, toujours accompagnés d'un signe ou d'un libellé, jamais de la couleur seule (accessibilité).
- Branding : le **logo DigiWomen School** sur les PDF et les documents de l'entreprise, la marque **« DIWAA Finance »** dans l'interface (titre, page de connexion). Les deux ne sont jamais confondus.
- Mobile : la sidebar devient une barre de navigation basse. Le formulaire de dépense utilise `<input type="file" accept="image/*" capture="environment">` pour la prise de photo.
- Framer Motion uniquement pour les transitions de panneaux, les toasts et l'apparition des cartes, avec respect de `prefers-reduced-motion`.

## 8. Stack et versions

| Besoin | Choix | Statut |
|---|---|---|
| Framework | Next.js 16.4.3 (installé) | ✅ |
| ORM | Prisma 7.10.1 + `@prisma/adapter-neon` (client généré dans `generated/prisma`) | ✅ vérifié (build Next 16 OK) |
| Validation / formulaires | Zod, React Hook Form, `@hookform/resolvers` | ✅ cahier |
| UI | Tailwind 4, Lucide React, Framer Motion, Recharts | ✅ cahier |
| Auth | Better Auth (sessions en base Neon, e-mail + mot de passe, comptes créés par invitation) | ✅ validé |
| Stockage | Cloudflare R2, bucket **privé** + URL signées | ✅ validé |
| PDF | `@react-pdf/renderer` côté serveur (pas de Chromium) | ✅ validé |
| Hébergement / cron | Vercel + Vercel Cron | proposé (non objecté) |
| Tests | Vitest (unitaires et intégration sur une branche Neon de test), Playwright (E2E) | proposé |
| Notifications | Boîte de notifications dans l'application uniquement pour la bêta. E-mail plus tard (ex. Resend) | proposé |

## 9. Journal des décisions

| Date | Décision | Choix |
|---|---|---|
| 2026-10-31 | Authentification | Better Auth |
| 2026-10-31 | Stockage des fichiers | Cloudflare R2 (privé, URL signées) |
| 2026-10-31 | Génération PDF | @react-pdf/renderer |
| 2026-10-31 | Solde de gestion | Encaissements − dépenses comptabilisées, hors salaires |
| 2026-10-31 | Propositions A1 à A12 | Validées telles que décrites dans 00-ETAT-DES-LIEUX.md §3 |
| 2026-10-31 | Version Prisma | 7.10.1 fixée (`latest` npm = 8.0.0-rc, hors plage supportée par Better Auth) |
| 2026-10-31 | Comptes (révisé) | Création de compte **par la personne elle-même** (mot de passe + confirmation) **sur invitation** de l'administrateur, qui fixe l'e-mail et le profil. Formulaire propre à chaque profil (`lib/validation/signup.ts`). Code de 8 caractères, haché, valable 7 jours, usage unique, révoqué après 5 essais. 1er admin : `npm run admin:create`. Voir `docs/02-GUIDE-COMPTES.md` |
| 2026-10-31 | Pages d'entrée | Mobile d'abord : en-tête photo + formulaire ; à partir de 1024 px, panneau photo fixe à gauche + contenu à droite. Aucune hauteur fixe |
| 2026-10-31 | Photo de profil | Stockée en base (`user_avatar`, 256×256 WebP normalisé par sharp, EXIF retiré), servie par `/api/avatar/[userId]` aux seuls utilisateurs connectés, URL versionnée dans `user.image`. Migration vers R2 prévue au lot 2 |
| 2026-10-31 | Interface | Thème « tableau de bord » : canvas `#e8e6e5`, cartes 1.5rem, couleur d'action vert pétrole `pine-800` partagée avec les pages d'entrée |
| 2026-10-31 | Transactions | `maxWait` 10 s / `timeout` 15 s : le réveil d'une base Neon en veille dépasse les 2 s par défaut |
