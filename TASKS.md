# TASKS — DIWAA Finance (DigiWomen School)

Légende : `[ ]` à faire · `[~]` en cours · `[x]` terminé (au sens de la « Définition de terminé » du prompt maître)

## Lot 0 — Cadrage
- [x] Lecture du cahier des charges et du prompt maître
- [x] État des lieux : `docs/00-ETAT-DES-LIEUX.md`
- [x] Proposition d'architecture, de modèle de données et de permissions : `docs/01-ARCHITECTURE.md`
- [x] Décisions structurantes : Better Auth · Cloudflare R2 · @react-pdf/renderer · solde hors salaires
- [x] Propositions par défaut A1 à A12 validées (31/10/2026)
- [x] Logo DigiWomen School ajouté (`public/brand/digiwomen-school-logo.png`, fond rendu transparent)

## Lot 1 — Socle, authentification, rôles, paramètres  `[~]`
- [x] Dépendances : Prisma **7.10.1** (fixé : `latest` = 8.0 RC, incompatible Better Auth) + adaptateur Neon, Better Auth 1.7, Zod 4, RHF, Lucide, Framer Motion, Vitest
- [x] `.env.example`, `prisma.config.ts`, schéma (User/Session/Account/Verification, CompanySettings, AuditEvent), migration `init` appliquée
- [x] Journal d'audit append-only : trigger SQL bloquant UPDATE/DELETE/TRUNCATE + `recordAudit()` transactionnel
- [x] Authentification Better Auth : connexion, déconnexion, sessions 8 h, inscription publique désactivée, compte désactivé = connexion refusée
- [x] `proxy.ts` (redirection optimiste) + DAL `lib/auth/session.ts` (rôle relu en base à chaque requête) + `forbidden()` 403
- [x] `lib/authz/policy.ts` (matrice unique) + 111 tests de la matrice ; `safeRedirectPath` (anti redirection ouverte) + tests
- [x] Coquille : sidebar bureau, tiroir mobile animé, navigation filtrée par rôle, modules futurs marqués « Bientôt »
- [x] Paramètres entreprise (lecture directrice/admin, modification admin, audit avant/après)
- [x] Utilisateurs (admin) : invitations (code + lien + message à copier, révocation), changement de profil, désactivation, sessions révoquées, dernier admin protégé, audit
- [x] Création de compte par la personne invitée : étape 1 e-mail + code, étape 2 formulaire propre au profil (mot de passe + confirmation), connexion automatique
- [x] 9 tests d'intégration du parcours d'invitation (base réelle, garde-fou anti-`main`) : `INTEGRATION_DATABASE_URL=… npm run test:integration`
- [x] Recette navigateur (Edge) : racine → bienvenue (même avec cookie périmé), création de compte, refus des paramètres au collaborateur, déconnexion / reconnexion
- [x] Script d'amorçage du premier administrateur `npm run admin:create`
- [x] Pages d'entrée responsives (mobile d'abord, 2 colonnes ≥ 1024 px), style vert pétrole / sable (2e maquette), logo DigiWomen School crème sur fond sombre : `/bienvenue` (accueil) et `/connexion` (sans onglet d'inscription : comptes créés par l'administrateur)
- [ ] Remplacer les photos provisoires `public/brand/provisoire-*.webp` (extraites de la maquette, basse résolution) par les originaux HD
- [ ] Créer une branche Neon `test` durable pour `npm run test:integration` (la branche jetable `smoke-lot1` a été supprimée)
- [ ] Branche Neon `dev` séparée de `main` (aujourd'hui l'application de dev pointe sur `main`)
- [ ] Seed de démonstration étiqueté : reporté (rien à démontrer avant le lot 2)

### Incident du 31/10/2026 (à traiter)
- Un compte de test **Administrateur** `autre@test.invalid` a été créé par erreur dans la base **`main`** pendant la recette (le script a lu `.env.local` au lieu de la branche de test). Correctif : `override: false` explicite + affichage de la base ciblée avant écriture. **Nettoyé le 31/10/2026** : compte supprimé de `main` (user + account, aucune session). L'événement d'audit n° 1 `user.bootstrap_admin` est conservé (append-only) et documente cet incident.
- `BETTER_AUTH_SECRET` local régénéré (valeur exposée dans une sortie de commande).

## Interface et profil (31/10/2026)
- [x] Refonte visuelle inspirée de la maquette « tableau de bord » : fond gris chaud, cartes arrondies à ombre douce, motif de points, tuiles d'icônes, pastilles d'état, menu actif en pilule vert pétrole, carte utilisateur sombre, barre supérieure (date + utilisateur). Aucune fonctionnalité modifiée, aucun chiffre fictif
- [x] Photo de profil pour chaque utilisateur (page « Mon profil ») : ajout, changement, retrait ; JPEG/PNG/WebP ≤ 5 Mo, type vérifié par signature, recadrage 256 px WebP, EXIF supprimé ; servie uniquement aux utilisateurs connectés ; audit
- [x] Photos affichées dans le menu, la barre supérieure, le menu mobile et la liste des utilisateurs (initiales colorées à défaut)
- [ ] Déplacer les photos vers Cloudflare R2 au lot 2 (stockées en base pour l'instant, ~2 à 15 Ko chacune)

## Déploiement Vercel (31/10/2026)
- [x] Build sans variables d'environnement : client Prisma créé au premier usage (`lib/db.ts`)
- [x] Connexion en ligne (`INVALID_ORIGIN`) : adresses Vercel acceptées automatiquement (`lib/auth/origins.ts`), liens d'invitation sur le domaine de production
- [x] Origines Vercel poussées (commit 190ed51) : la production ne renvoie plus INVALID_ORIGIN
- [x] Script `npm run admin:reset-password` (saisie masquée, sessions fermées, audit), testé sur branche jetable
- [x] E-mail normalisé (espaces, majuscules) avant validation dans tous les formulaires (`emailSchema`)
- [ ] Pousser le script et la correction e-mail sur GitHub

## Envoi des invitations par e-mail (31/10/2026)
- [x] Module SMTP générique (`lib/email`), Gmail par défaut, délais courts, n'interrompt jamais l'opération métier
- [x] E-mail d'invitation aux couleurs DIWAA (HTML + texte, données échappées, logo crème)
- [x] Envoi automatique à la création ; repli code + lien si échec ; bouton « Renvoyer » (nouveau code) ; audit `invitation.email_sent` / `invitation.email_failed`
- [x] Tests : 6 unitaires (configuration, modèle, serveur injoignable) + 4 d'intégration (succès, échec, renvoi, permissions)
- [ ] Mot de passe d'application Gmail + variables SMTP dans `.env.local` et Vercel
- [ ] Premier envoi réel de contrôle
- [ ] Corriger `BETTER_AUTH_URL` = `https://track-fin26.vercel.app` dans Vercel (Production)
- [ ] Séparer les bases : branche Neon `dev` pour le local, `main` pour la production

## Lot 2 — Stockage privé et dépenses
- [ ] Upload sécurisé (MIME par signature, taille, nom régénéré) + URL signées
- [ ] Catégories et projets
- [ ] Déclaration (mobile, photo) → circuit de vérification → comptabilisation, confirmation facultative de l'administrateur
- [ ] Historique des statuts + audit + tests du workflow et des permissions

## Lot 3 — Annotations
- [ ] Fils rattachés à une dépense, une facture ou un justificatif, états, pièce complémentaire, notifications

## Lot 4 — Factures
- [ ] Clients, facture multi-lignes, émission avec numérotation atomique (test de concurrence)
- [ ] Paiements partiels, reste dû, annulation contrôlée
- [ ] PDF de facture (et reçu si l'option est retenue)

## Lot 5 — Tableau de bord, trésorerie, rapports
- [ ] Indicateurs distincts, formule du solde de gestion affichée, filtres de période
- [ ] 3 graphiques Recharts
- [ ] Trésorerie déclarée
- [ ] Rapports PDF mensuels et annuels

## Lot 6 — Alertes et notifications
- [ ] Cron + règles J+7, 3 jours, rappel, observations, arriérés, seuil · idempotence · boîte de notifications

## Lot 7 — Personnel et paie
- [ ] Fiches collaborateurs, types de primes, indemnités et retenues
- [ ] Formulaire mensuel, workflow du bulletin, PDF
- [ ] Versements et avances, calcul des arriérés (tests unitaires approfondis), portail « Mes bulletins »

## Lot 8 — Recette
- [ ] Tests E2E des parcours majeurs, revue de sécurité, accessibilité, sauvegarde et restauration Neon, déploiement bêta

## Bloqué jusqu'à confirmation métier (cahier, §15)
- [ ] Mentions légales, coordonnées bancaires, format de numérotation, définition du solde de gestion, règles de paie gabonaises (expert), durées de conservation, liste des utilisateurs

## À faire plus tard
- [ ] Réinitialisation du mot de passe (nécessite un canal e-mail/SMS, cahier §15 point 11)
