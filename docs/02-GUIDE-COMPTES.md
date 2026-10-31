# DIWAA Finance — Créer les comptes utilisateurs

Chaque personne crée **elle-même** son compte : elle choisit son mot de passe et le confirme. Pour que personne ne puisse s'attribuer un profil qui n'est pas le sien (par exemple « Directrice générale »), la création passe par une **invitation** : l'administrateur général fixe l'adresse e-mail et le profil, la personne fait le reste.

## 1. Une seule fois : le premier administrateur

Le tout premier compte est créé depuis le terminal, dans le dossier `my-app` :

```
npm run admin:create -- --name "Prénom Nom" --email adresse@exemple.com
```

- Le script affiche la base visée : vérifiez qu'il indique la branche `main`.
- Il demande le mot de passe deux fois, sans l'afficher (10 caractères minimum).
- Il refuse de s'exécuter si un administrateur actif existe déjà.

## 2. L'administrateur invite une personne

Dans l'application : **Paramètres → Utilisateurs → Inviter une personne**.

| Champ | Rôle |
|---|---|
| Adresse e-mail | Sera l'identifiant de connexion de la personne |
| Nom (facultatif) | Pré-remplit son formulaire |
| Profil | Directrice générale, Administrateur général, Secrétaire ou Collaborateur |

Cliquez sur **Générer l'invitation**. L'application affiche :

- un **code d'invitation** de 8 caractères (ex. `K7P4-M2QX`), valable **7 jours** ;
- un **lien** qui pré-remplit l'e-mail et le code ;
- un bouton **Copier le message complet**, prêt à envoyer par WhatsApp ou par e-mail.

⚠️ Le code n'est affiché **qu'une seule fois** : il n'est pas conservé en clair. S'il est perdu, générez une nouvelle invitation pour le même e-mail (l'ancienne est alors annulée automatiquement).

Les invitations non utilisées apparaissent dans **Invitations en attente**, où vous pouvez les révoquer.

## 3. La personne crée son compte

Sur l'écran d'accueil, elle choisit **Créer mon compte** (ou elle ouvre directement le lien reçu).

**Étape 1** : elle saisit son adresse e-mail et son code d'invitation.

**Étape 2** : elle remplit le formulaire **de son profil**.

| Profil | Champs demandés |
|---|---|
| Directrice générale | Nom complet, téléphone (facultatif), mot de passe + confirmation |
| Administrateur général | Nom complet, téléphone (facultatif), mot de passe + confirmation |
| Secrétaire | Nom complet, téléphone (facultatif), intitulé du poste (facultatif), mot de passe + confirmation |
| Collaborateur | Nom complet, téléphone (facultatif), **poste / fonction (obligatoire)**, mot de passe + confirmation |

Chaque formulaire rappelle aussi ce que le profil permet de faire. Une fois le compte créé, la personne est **connectée automatiquement**. Ensuite, elle se connecte avec son e-mail et son mot de passe.

## 4. Sécurité

- Le profil vient **toujours de l'invitation**, jamais du formulaire : une personne ne peut pas changer son propre profil.
- Un code ne fonctionne que pour l'e-mail invité, **une seule fois**, pendant 7 jours.
- Après **5 codes erronés**, l'invitation est annulée : il faut en générer une nouvelle.
- Les mots de passe sont chiffrés de façon irréversible. Personne ne peut les relire, pas même l'administrateur.
- Toute invitation, révocation et création de compte est enregistrée dans le journal d'audit.

## 5. Gérer les comptes existants

Dans **Paramètres → Utilisateurs**, l'administrateur peut changer le profil d'une personne ou désactiver son compte. La personne est alors déconnectée immédiatement. Il reste toujours au moins un administrateur actif.

**Mot de passe oublié** : la réinitialisation n'est pas encore disponible dans l'application. Elle est prévue dès qu'un canal d'envoi (e-mail ou SMS) sera choisi.
