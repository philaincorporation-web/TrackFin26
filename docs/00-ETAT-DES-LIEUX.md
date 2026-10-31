# DIWAA Finance — État des lieux

> Produit : **DIWAA Finance** (outil interne) · Entreprise utilisatrice : **DigiWomen School**
> Sources de vérité : `DIWAA-FINANCE-CAHIER-DES-CHARGES.pdf` (v1.0, 31/10/2026) et `DIWAA-FINANCE-PROMPT-MAITRE.md`.
> Date de l'analyse : 31 octobre 2026.

## 1. Point de départ technique

| Élément | Constat |
|---|---|
| Dépôt | `my-app/`, un seul commit « Initial commit from Create Next App » |
| Framework | Next.js **16.4.3**, React 19.3, App Router, TypeScript strict |
| Config | `cacheComponents: true`, `partialPrefetching: true` (impose des règles précises pour lire la session, voir `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`) |
| Style | Tailwind CSS 4 (loader Turbopack) |
| Interception des requêtes | En Next 16, `middleware.ts` est remplacé par **`proxy.ts`** |
| Non installé | Prisma, Zod, React Hook Form, Recharts, Framer Motion, Lucide, auth, stockage, PDF, tests |
| Assets | Le logo DigiWomen School a été fourni dans la conversation, mais il **n'est pas encore dans le dépôt** |

## 2. Exigences comprises (synthèse)

1. **4 rôles** : Directrice générale (supervision/lecture + annotations), Administrateur général (supervision + confirmation facultative non bloquante), Secrétaire (opérationnel : factures, encaissements, contrôle des dépenses, comptabilisation, paie), Collaborateur (ses propres dépenses et bulletins uniquement).
2. **Dépenses** : Brouillon → Soumise → (Précision demandée ↔ Soumise) → Validée « à comptabiliser » → Comptabilisée, ou Rejetée (motif facultatif). La confirmation de l'administrateur est un drapeau parallèle, jamais une étape bloquante. Rien n'est supprimé.
3. **Factures** : plusieurs lignes, numérotation serveur atomique sans doublon (`FAC-2026-001` indicatif), PDF avec logo, paiements partiels multiples, statuts brouillon/émise/en attente/partiellement payée/payée/en retard/annulée, aucune modification silencieuse après émission.
4. **Annotations** rattachées à une dépense, une facture ou un justificatif, avec auteur, horodatage et état du fil. Elles ne modifient jamais l'original.
5. **Tableau de bord** : indicateurs distincts (facturé ≠ encaissé ≠ déclaré ≠ comptabilisé ≠ solde de gestion ≠ trésorerie déclarée), 3 graphiques, filtres de période. Formule du solde de gestion affichée.
6. **Trésorerie déclarative** : montant, date, auteur, commentaire. Pas de connexion bancaire.
7. **Alertes** : facture impayée à J+7 après échéance, dépense non traitée après 3 jours, rappel avant échéance (paramétrable), observations en attente, arriérés de salaire, seuil de trésorerie bas. Sans doublons. Boîte de notifications dans l'application.
8. **Rapports PDF** mensuels et annuels avec période et date de génération.
9. **Paie** : fiche collaborateur, formulaire mensuel (fixe, primes en liste déroulante, primes de mission rattachées à un projet, prime exceptionnelle, indemnités, retenues/avances), bulletin PDF, règlement suivi **séparément**, versements multiples, report automatique des arriérés **sans double comptage**.
10. **Historique / audit** append-only, filtrable par période, utilisateur et type.
11. **Non fonctionnel** : responsive (mobile prioritaire pour les collaborateurs), autorisations côté serveur, stockage privé, Zod côté serveur, transactions, tests (unitaires, intégration, permissions, E2E).

## 3. Points ambigus et contradictions relevées

| # | Sujet | Ambiguïté | Proposition par défaut (à valider) |
|---|---|---|---|
| A1 | Comptabilisation | La secrétaire valide **et** comptabilise : pas de séparation des tâches. | Accepté pour la bêta, tracé dans l'audit. Une option « comptabilisation par un autre profil » pourra être ajoutée. |
| A2 | Droits de la directrice | « Lecture principalement, droits de modification à définir. » | Bêta : **lecture + annotation uniquement**. |
| A3 | Validation des bulletins | « Personne habilitée à définir. » | Préparation par la secrétaire, validation par la **directrice** ou l'administrateur (paramétrable). |
| A4 | Moment de numérotation | Le cahier ne dit pas si le numéro est attribué au brouillon ou à l'émission. | **À l'émission** : les brouillons abandonnés ne laissent aucun trou dans la séquence. |
| A5 | Statut « en attente de paiement » vs « émise » | Ces deux statuts se recouvrent. | `émise` = état stocké, `en attente / partiellement payée / payée / en retard` = **calculés** à partir des paiements et de l'échéance. Ainsi un statut ne peut pas diverger des montants. |
| A6 | Annulation d'une facture émise | Règles correction / avoir / annulation « à valider ». | Bêta : annulation avec motif obligatoire, réservée à la secrétaire, auditée, numéro jamais réutilisé. Avoirs : plus tard. |
| A7 | Solde de gestion | « Formule documentée et validée. » | `Encaissements reçus sur la période − Dépenses comptabilisées sur la période`. **Question ouverte** : les salaires versés en font-ils partie ? |
| A8 | Imputation des versements de salaire | Le cahier ne dit pas si un versement règle d'abord l'arriéré ou le mois courant. | **Le plus ancien d'abord** (FIFO). C'est l'usage courant, et cela rend l'arriéré déterministe. |
| A9 | Avances sur salaire | Une avance est-elle un versement anticipé ou une retenue future ? | Versement de type `AVANCE` imputé sur le mois concerné, donc pas de retenue automatique. |
| A10 | Devise | « FCFA/XAF si confirmée. » | XAF, montants **entiers** (le XAF n'a pas de centimes en usage courant). |
| A11 | Dépenses non déclarées par un collaborateur | La secrétaire peut-elle saisir une dépense directement (ex. facture fournisseur) ? | Oui, elle peut créer une dépense au nom de l'entreprise, qui suit le même circuit et la même trace. |
| A12 | Portail salarié | « Si le portail salarié est activé. » | Interrupteur dans les paramètres, désactivé par défaut. |
| A13 | Date de la conversation | Le cahier est daté du 31/10/2026, mais une maquette de référence est datée de 2025. | Sans effet sur le code. |

## 4. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Fuite de données entre collaborateurs (salaires, justificatifs) | Critique | Contrôle d'accès centralisé (`can()`), filtrage par `ownerId` dans **chaque** requête, tests de permissions par rôle, fichiers en stockage privé uniquement via des URL signées de courte durée |
| Doublon ou trou de numéro de facture | Élevé | Table compteur par série et année, `UPDATE … RETURNING` dans une transaction, contrainte `UNIQUE`, test de concurrence |
| Double comptage des arriérés | Élevé | Les arriérés ne sont **jamais stockés comme une nouvelle dette** : ils sont calculés (somme des dus − somme des versements). Tests unitaires dédiés |
| Taux légaux de paie inventés | Juridique | Aucun taux codé. Rubriques de retenue saisies ou paramétrées par un profil habilité. Bandeau « règles légales non validées » tant que le paramètre n'est pas confirmé |
| Données de démonstration prises pour des données réelles | Élevé | Seed démo séparé, bandeau « DONNÉES DE DÉMONSTRATION » global, jamais exécuté en production |
| Cache Components exposant des données d'un utilisateur à un autre | Critique | Pas de `"use cache"` sur des données dépendant de la session. Respect du guide `authentication-with-cache-components.md` |
| Uploads malveillants | Moyen | Liste blanche de types MIME vérifiée par signature (magic bytes), taille max, nom de fichier régénéré, pas d'exécution, antivirus si disponible |
| Alertes en doublon | Moyen | Clé d'idempotence unique `(type, objet, échéance)` en base |
| Migration risquée sur une base réelle | Élevé | Branches Neon (dev / preview / prod), `prisma migrate deploy` uniquement en CI, sauvegarde avant migration |

## 5. Décisions attendues

### Structurantes : bloquent le lot 1

1. Solution d'**authentification**
2. Solution de **stockage privé** des justificatifs et bulletins
3. Solution de **génération PDF**
4. **Hébergement** et planificateur des alertes

### Métier : à confirmer avant production (cahier, §15)

Logo et mentions légales officielles · format de numérotation · devise et arrondis · coordonnées bancaires sur les factures · procédure d'annulation et d'avoir · définition du solde de gestion · seuil de « dépense importante » · délai du rappel avant échéance · validateur des bulletins · règles de paie gabonaises (expert) · canaux de notification · durées de conservation · liste des utilisateurs · dépenses récurrentes.
