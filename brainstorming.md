---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
session_active: false
workflow_completed: true
continuation_date: 2026-02-05
session_extended: true
extension_count: 2
last_extension_date: 2026-02-05
completion_date: 2026-02-05
inputDocuments: []
session_topic: 'Plateforme de gestion de tournois Belouga Tournament (Next.js)'
session_goals: 'Permettre la gestion complète des tournois et l''administration du site web pour le propriétaire.'
selected_approach: 'ai-recommended'
techniques_used: ['Role Playing', 'Mind Mapping', 'Reverse Brainstorming', 'Six Thinking Hats', 'Brain Writing', 'Constraint Mapping', 'Gap Analysis UI/UX', 'Question Storming', 'Competitive Analysis']
ideas_generated: []
context_file: 'file:///Users/henchoznoe/Documents/Github/belouga-tournament/_bmad/bmm/data/project-context-template.md'
---

# Brainstorming Session Results

**Facilitator:** Noé
**Date:** 2026-02-02

## Session Overview

**Topic:** Plateforme de gestion de tournois Belouga Tournament (Next.js)
**Goals:** Permettre la gestion complète des tournois et l'administration du site web pour le propriétaire.

### Context Guidance

This brainstorming session focuses on software and product development considerations:
- User Problems and Pain Points
- Feature Ideas and Capabilities
- Technical Approaches
- User Experience
- Business Model and Value
- Market Differentiation
- Technical Risks and Challenges
- Success Metrics

### Session Setup

We are focusing on creating a robust tournament management system for the "Belouga Tournament". The core objective is to provide a comprehensive admin interface for the owner to manage tournaments and the website content, built on a Next.js stack.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Plateforme de gestion de tournois Belouga Tournament (Next.js) with focus on Permettre la gestion complète des tournois et l'administration du site web pour le propriétaire.

**Recommended Techniques:**

- **Role Playing:** Nous adopterons tour à tour la perspective de l'Organisateur (ton ami) et celle du Joueur. Identifier clairement les besoins et les points de friction spécifiques à chaque type d'utilisateur pour ne rien oublier.
- **Mind Mapping:** Nous partirons du concept central "Belouga Tournament" pour créer des branches (Admin, Public, API, etc.). Organiser visuellement les modules du projet et prioriser le développement.
- **Reverse Brainstorming:** Nous allons générer des problèmes (ex: "Le site crash pendant la finale", "L'admin ne peut pas annuler un match"). Identifier les "Edge cases" et les fonctionnalités critiques de sécurité/stabilité.


**AI Rationale:** Cette séquence permet d'abord de s'ancrer dans la réalité des utilisateurs (Role Playing), puis de structurer architecturalement la solution (Mind Mapping), et enfin de la blinder contre les échecs (Reverse Brainstorming). C'est une progression logique du "Qui" vers le "Quoi" puis le "Comment sécuriser".

## Technique Execution Results

**Role Playing:**

- **Interactive Focus:** Organisateur (gestion sans friction) vs Joueur (capitaine d'équipe).
- **Key Breakthroughs:**
    - **Approche MVP Organisateur:** Login Discord -> Inscription directe. Champs déclaratifs (confiance) pour éviter la complexité technique inutile au départ.
    - **Flux Joueur/Capitaine:** Le capitaine crée l'équipe et s'inscrit au tournoi en une fois. Les coéquipiers rejoignent simplement l'équipe créée.
    - **Infos Critiques Joueur:** Cashprize, Jeu, Date, Règles.
- **User Creative Strengths:** Très clair sur la portée MVP et la simplification des processus ("on fait confiance").
- **User Creative Strengths:** Très clair sur la portée MVP et la simplification des processus ("on fait confiance").
- **Energy Level:** Pragmatique et focus sur l'efficacité.

**Mind Mapping:**

- **Interactive Focus:** Structuration de l'Espace Admin vs Espace Public.
- **Key Breakthroughs:**
    - **Architecture Admin:** Distinction claire Super Admin (Site/Sponsors/Global) vs Admin Tournoi. Cycle de vie Tournoi (Privé/Draft -> Public).
    - **Architecture Public:** V1 centrée sur l'immersion (Landing Fullscreen, Font Paladins, Stream intégré).
    - **Pages Clés Public:** Home, Stream (quentadoulive), Tournois (Actuels/Archivés), Profil Joueur, Contact (Réseaux dynamiques).
    - **Scope-Cutting:** Pas de classement général pour la v1 (focus essentiel).
- **New Insights:** L'importance du branding visuel (Paladins font, wall.png) est centrale pour l'expérience utilisateur.

**Reverse Brainstorming:**

- **Interactive Focus:** Scénarios catastrophes et points de défaillance critiques.
- **Key Breakthroughs/Failures Identified:**
    - **Le Cauchemar #1:** "Les joueurs ne peuvent pas s'inscrire". Conséquence : La fonctionnalité d'inscription doit être BETON armé (tests critiques ici).
    - **Le Problème du "No-Show":** 12/12 inscrits mais un absent = tournoi gâché. Solution impérative : **Gestion de File d'Attente (Waitlist)** intégrée.
    - **L'Enfer UX:** Un dashboard complexe ou lent en plein stress de tournoi. Solution : UX minimaliste, actions rapides, "simple d'utilisation même sous pression".
- **Developed Ideas:** La "Waitlist automatisée" est passée d'une idée optionnelle à une nécessité critique pour la viabilité des tournois.

## Idea Organization and Prioritization

**Thematic Organization:**

**Thème 1 : L'Efficacité Admin (Zéro Friction)**
*   *Focus :* Permettre à l'organisateur de gérer le tournoi sans stress.
    *   **Dashboard "Cockpit" :** Actions rapides, gestion simple des statuts.
    *   **Hiérarchie :** Super Admin (Global) vs Admin Tournoi (Opérationnel).
    *   **Gestion "Trust-based" :** Champs déclaratifs pour démarrer vite.

**Thème 2 : L'Immersion Joueur (Branding & Simplicité)**
*   *Focus :* Donner envie et simplifier l'accès.
    *   **Design :** Landing Fullscreen, ambiance "Belouga" (Paladins).
    *   **Flux "Capitaine" :** Création équipe + inscription tournoi pré-remplie.
    *   **Stream & Socials :** Intégration Twitch (quentadoulive) et réseaux dynamiques.

**Thème 3 : La Robustesse (Anti-Fragilité)**
*   *Focus :* Prévenir les échecs critiques.
    *   **Anti-No-Show :** Liste d'attente (Waitlist) automatisée.
    *   **Inscription Béton :** Le flux critique à tester absolument.

**Prioritization Results:**

1.  **Top Priority (Critical Path):** Système d'Inscription Discord / Création d'Équipe.
2.  **Secondary Priority:** Dashboard Admin de gestion de tournoi.
3.  **Tertiary Priority:** Waitlist automatisée.

**Action Planning (Top Priority):**

**Idea: Système d'Inscription & Équipes**
**Why This Matters:** C'est la brique fondamentale. Sans équipes, pas de tournoi.
**Next Steps:**
1.  **Tech:** Configurer NextAuth avec le Provider Discord (scope: identify, email).
2.  **Data:** Modéliser la base de données (Prisma) : `User` (lié à Discord), `Team` (Nom, Capitaine), et `TournamentRegistration` (Lien Team <-> Tournoi).
3.  **UX:** Créer le formulaire "Créer mon équipe" qui crée l'équipe, assigne le capitaine, et facilite l'invitation des mates.
**Resources Needed:** Credentials Discord Developer Portal, Projet Next.js (existant), Base de données (PostgreSQL/Prisma).
**Success Indicators:** Un utilisateur peut se connecter via Discord, créer une équipe et la voir en base de données.

## Session Summary and Insights

**Key Achievements:**
-   **Architecture MVP Validée :** Un compromis clair entre fonctionnalités riches (Admin, Tournois) et simplicité technique (Champs déclaratifs, pas de leaderboard V1).
-   **Focus Utilisateur :** Distinction claire des besoins "Organisateur" (Efficacité) vs "Joueur" (Immersion/Simplicité).
-   **Sécurisation du Flow :** Identification critique du "No-Show" et solution par Waitlist.

**Session Reflections:**
L'approche par "Role Playing" a été déterminante pour simplifier les attentes initiales et revenir à un MVP réalisable. Le "Reverse Brainstorming" a permis de transformer des fonctionnalités "nice-to-have" (Waitlist) en impératifs de robustesse. Le projet est maintenant prêt pour la phase de spécification technique détaillée.





## Session Continuation: Technical Validation

**Date:** 2026-02-04
**Focus:** Validation des choix techniques (Next.js/Prisma/Tailwind) et identification des manques.

### Technique Execution Results

**Six Thinking Hats:**

- **Interactive Focus:** Validation de la stack technique Next.js 16 / Prisma / Tailwind 4 / Vercel.
- **Chapeau Blanc (Faits):**
    - Stack moderne et maîtrisée par le développeur.
    - Hébergement Vercel (CI/CD intégré) + DB Supabase.
    - Contrainte forte : On garde cette stack.
- **Chapeau Noir (Risques):**
    - **Coûts Serverless :** Mitigés par l'utilisation stricte du plan Gratuit (limite naturelle).
    - **Compatibilité (Bleeding Edge) :** Vérifiée, toutes les librairies actuelles sont OK.
    - **Vendor Lock-in :** Jugé faible, portabilité possible via export DB et build ailleurs.

### Technique Execution: Brain Writing Results

**Question:** Zones d'ombre (CMS, Teams, Notifs, Archives, Check-in) ?

**Résultats / Décisions :**

1.  **CMS Global (Superadmin) :**
    - **Contrôle total :** Réseaux sociaux (affichage conditionnel si lien vide), Sponsors (img/txt/link), Stream URL, Logo.
    - **Stockage :** PostgreSQL ou Vercel Blob (pour portabilité), pas de dur dans le code.

2.  **Gestion Équipes (Scope V1) :**
    - **Admin Power :** Seuls les admins peuvent kick/dissoudre pour la V1 (Capitaines = V2).
    - **Taille Variable :** Configurable par tournoi (ex: 5 pour Valo, 2 pour RL).
    - **Waitlist Intelligente :** Optionnelle. Auto-fill si un slot se libère dans une équipe.

3.  **Notifications :**
    - **Canal :** Email (idéalement celui du compte Discord).
    - **Scope :** Validation inscription, etc.

4.  **Cycle de Vie (Archives) :**
    - **Automatisation :** SI date_fin < NOW, ALORS statut = 'ARCHIVED'.
    - **UX :** Filtrage simple sur la page tournois.

5.  **Check-in (Out of Scope) :**
    - **Manuel :** Géré hors site (Discord/Sur place). Instructions statiques sur la page tournoi.

### Technique Execution: Constraint Mapping Results

**Question:** Deadlines & Compétences manquantes ?

**Résultats / Décisions :**

-   **Timeline :** Aucune deadline stricte. Projet "Passion" sans pression temporelle externe.
-   **Compétences :** Autonomie complète. Pas de bloquant technique identifié (Next.js, Prisma, Tailwind maîtrisés).

## Idea Organization and Prioritization

**Thematic Organization:**

**Thème 1 : Architecture & Robustesse (Le Socle)**
*   *Stack Validée :* Next.js 16 / Prisma / Tailwind 4 / Vercel / Supabase.
*   *Moteur Tournoi :* Intégration **Toornament** (Iframe/ID) pour la sémantique de tournoi complexe.
*   *Sécurité :* Login Discord obligatoire pour l'identité.

**Thème 2 : Expérience Admin (Le Contrôle)**
*   *Gestion Équipes :* Pouvoir de kick/dissolution réservé aux Admins pour la V1.
*   *Configurabilité :* Taille d'équipe variable selon le jeu (ex: 2 vs 5).
*   *CMS Global (V2) :* La gestion dynamique des assets (Logo, Sponsors) est repoussée.

**Thème 3 : Expérience Joueur (La Fluidité)**
*   *Flux Critique :* Inscription + Création d'équipe simplifiée.
*   *Communication :* Notifs par Email (compte Discord).
*   *Waitlist (V2) :* Liste d'attente automatisée repoussée.

**Thème 4 : Cycle de Vie (L'Automatisation)**
*   *Archives (V1) :* Logique simple \`SI date_fin < NOW ALORS statut = 'ARCHIVED'\`.
*   *Check-in :* Hors-site (Discord/Manuel).

**Prioritization Results:**

-   **Top Priority (V1 - Critical Path):**
    1.  **Système d'Inscription :** Login Discord, Création Team, Join Tournament.
    2.  **Affichage Tournoi :** Intégration Iframe Toornament.
    3.  **Admin Basic :** Gestion manuelle des équipes (Kick/Dissolve).
    4.  **Auto-Archiving :** Implémentation logique simple (Low effort / High value).

-   **Nice to Have / V2:**
    1.  **CMS Global :** Administration des contenus site (Sponsors, Stream URL).
    2.  **Waitlist Automatisée :** Gestion complexe des désistements.
    3.  **Captain Power :** Gestion autonome de l'équipe par le capitaine.

## Session Summary and Insights

**Key Achievements:**
-   **Périmètre V1 Stabilisé :** On a tranché entre le "Rêve" (CMS complet, Waitlist) et la "Réalité" (V1 solide et maintenable).
-   **Stack Technique Validée :** Confirmation des choix Next.js 16/Vercel avec conscience des limites (Free plan).
-   **Zone de Risque Éliminée :** Utilisation de Toornament pour le moteur de bracket = gain de temps énorme.

Cette session a permis de passer d'une liste de fonctionnalités floue à un plan de développement chirurgical. L'extensibilité vers une V2 est prévue (CMS, Waitlist), mais ne polluera pas le code de la V1. **Le projet est prêt pour le développement.**

---

## Session Extension: Gap Analysis UI/UX

**Date:** 2026-02-04
**Focus:** Inventaire exhaustif des écrans, interactions et identification des manques UI/UX avant implémentation.

### Technique Execution: Gap Analysis UI/UX

**Interactive Focus:** Cartographie complète de l'interface pour détecter les zones d'ombre.

#### Phase 1.1 - Inventaire Admin Screens

**Authentification:**
- **Login Unique:** Discord OAuth via BetterAuth pour Joueurs ET Admins
- **Question UX Ouverte:** Une seule page login OU segmentation Joueurs/Admins pour meilleure UX ?

**Dashboard Admin (Post-Login):**
- **Sidebar persistante** avec menus de navigation
- **Zone de Logs/Notifications:** Joueurs en attente d'approbation, actions récentes
- **Accès contextuel** selon rôle (SuperAdmin vs Admin)

**Écrans Admin Identifiés:**

1. **Page Login** (Discord OAuth)
   - Potentiellement segmentée : Section "Joueurs" / Section "Admins"

2. **Dashboard Principal** (/admin/dashboard)
   - Vue d'ensemble des tournois actifs
   - Zone de logs/notifications
   - Statistiques rapides

3. **Liste des Tournois** (/admin/tournois)
   - Table avec filtres/tri
   - Actions rapides : Voir / Modifier / Supprimer
   - Toggle visibilité (Draft ↔ Public)
   - Scope : Admin voit uniquement ses tournois assignés, SuperAdmin voit tout

4. **Modification d'un Tournoi** (/admin/tournois/[id])
   - Formulaire complet :
     - Nom, dates (début/fin), description, règles
     - Toornament ID (iframe integration)
     - Chaîne Twitch de diffusion
     - Champs dynamiques d'inscription
     - Type de tournoi, jeu(x)
     - Nombre max joueurs/équipes
     - Statut : Draft / Publié
   - Bouton "Gérer les Équipes"

5. **Gestion des Équipes d'un Tournoi** (/admin/tournois/[id]/equipes)
   - Liste des équipes inscrites
   - Actions : Kick joueur / Dissoudre équipe
   - Gestion de la file d'attente (Waitlist) si implémentée

6. **[SuperAdmin] Gestion des Sponsors** (/admin/superadmin/sponsors)
   - CRUD complet : Ajouter / Modifier / Supprimer
   - Champs : Image, Texte, Lien
   - Sécurisé : Accessible uniquement par SuperAdmins

7. **[SuperAdmin] Contenu Global** (/admin/superadmin/contenu)
   - Modification des URLs (réseaux sociaux, stream)
   - Logo du site
   - Autres métadonnées globales
   - Sécurisé : Accessible uniquement par SuperAdmins

8. **[SuperAdmin] Gestion des Admins** (/admin/superadmin/admins)
   - Pré-créer un compte admin (via email Discord)
   - Assigner un Admin à un/des tournoi(s)
   - Révoquer des droits
   - Sécurisé : Accessible uniquement par SuperAdmins

**Statuts des Tournois:**

- **Pour Admins (Gestion de visibilité):**
  - `DRAFT` : Invisible au public, en cours de création
  - `PUBLISHED` : Visible au public

- **Pour Tous (Badges dynamiques affichés):**
  - `PRÉVU` : Date de début non atteinte
  - `EN COURS` : Date de début dépassée, date de fin non atteinte
  - `TERMINÉ` : Date de fin dépassée (remplace "Archivé")

- **Inscriptions (Affiché sur la page du tournoi):**
  - `OUVERTES` / `FERMÉES` (basé sur date limite ou nombre max atteint)

**Rôles et Permissions:**

| Rôle | Permissions |
|------|-------------|
| **SuperAdmin** | Accès total : Tous tournois, Gestion Sponsors, Contenu Global, Gestion Admins |
| **Admin** | Gestion complète (A→Z) des tournois qui lui sont assignés par SuperAdmins |
| **Joueur** | Inscription, Création/Rejoindre équipe, Consultation publique |

**Assignation des Rôles:**
- **Seed Initial:** 2 SuperAdmins créés par défaut (base de données)
- **Création Admin:** SuperAdmin pré-crée un compte avec email Discord
- **Détection Auto:** Lors du login Discord, si email correspond → promotion automatique Admin
- **Assignation Tournoi:** SuperAdmin assigne un Admin à un tournoi spécifique

#### Phase 1.2 - Inventaire Public Screens

**Décision UX Validée:** Login segmenté (Option B) - Deux entrées distinctes "Joueurs" / "Admins"

**Écrans Public Identifiés:**

1. **Landing Page** (/)
   - **Hero Section Fullscreen:** Immersion visuelle (ambiance Belouga/Paladins)
   - **CTA Principal:** Incitation à l'action (ex: "Rejoindre un Tournoi")
   - **Stats Belouga:** 2-3 statistiques clés (ex: tournois organisés, joueurs actifs)
   - **Aperçu Tournois:** Quelques tournois mis en avant + lien vers page complète
   - **Embed Twitch:** Stream principal (intégré)
   - **Sponsors:** Section dédiée (affichage dynamique)
   - **Footer:** Liens rapides, mentions légales, RS

2. **Page Tournois** (/tournois)
   - **Cards Tournois:** Affichage en grille
   - **Filtres/Tri:** Par statut (Prévu/En Cours/Terminé), jeu, date
   - **Badges Visuels:** Statut du tournoi (Prévu/En Cours/Terminé)
   - **Accès Détails:** Click sur card → Page détail

3. **Page Détail Tournoi** (/tournois/[id])
   - **Header:** Nom, Dates, Format, Jeu
   - **Navigation par Tabs:**
     - **Tab "Informations":** Description complète, cashprize, format détaillé
     - **Tab "Règles":** Règlement complet
     - **Tab "Stream":** Embed Twitch spécifique (si URL fournie par admin)
     - **Tab "Inscriptions":** Formulaire d'inscription (si ouvertes) OU message "Fermées"
   - **Iframe Toornament:** Affichage du bracket (dans tab "Informations" ou dédié ?)

4. **Tab Inscription (Dans Page Détail Tournoi)**
   - **Authentification Requise:** Prompt "Connectez-vous avec Discord" si non authentifié
   - **Formulaire Inscription:**
     - Champs dynamiques (configurés par admin du tournoi)
     - **Si Tournoi Solo:** Inscription directe
     - **Si Tournoi Équipe:** 
       - Option "Créer une équipe" (si premier joueur/capitaine)
       - Option "Rejoindre une équipe" (sélection équipe précréée)
   - **Confirmation:** Message succès + email de confirmation envoyé

5. **Page Profil Joueur** (/profil)
   - **Informations Affichées:**
     - Pseudo général
     - Email (lecture seule, lié à Discord)
   - **Édition Autorisée:** Pseudo (pas email pour V1)
   - **Historique Tournois:** (V2 ?)

6. **Page Stream** (/stream)
   - **Embed Twitch Principal:** (quentadoulive)
   - **Chat intégré ?** (Twitch chat)

7. **Page Contact / À Propos** (/contact)
   - **Liens Réseaux Sociaux:** Affichage dynamique (si spécifiés par SuperAdmins)
   - **Remerciements / Mentions**
   - **Formulaire de contact ?** (V2 ?)

**Parcours Joueur Complet (Inscription à un Tournoi):**

1. **Découverte:** Joueur arrive sur Landing Page
2. **Exploration:** Navigue vers `/tournois`, filtre/tri, clique sur un tournoi
3. **Détails:** Consulte les informations, règles
4. **Inscription (Tab "Inscriptions"):**
   - Si **non authentifié** → Prompt "Connectez-vous avec Discord"
   - **Login Discord** (page segmentée "Joueurs")
   - Retour automatique au tab "Inscriptions"
5. **Formulaire:**
   - **Si Tournoi Solo:** Remplit champs dynamiques → Soumet
   - **Si Tournoi Équipe:**
     - **Cas A (Premier joueur/Capitaine):** Nomme son équipe → Remplit champs → Soumet
     - **Cas B (Membre):** Sélectionne équipe précréée → Remplit champs → Soumet
6. **Confirmation:** Message succès + Email de confirmation
7. **Limitation V1:** Joueur ne peut PAS quitter une équipe (uniquement Admin peut kick/dissoudre)

**Embed Twitch - Emplacements:**
- **Landing Page:** Stream principal (toujours visible)
- **Page `/stream`:** Stream principal (page dédiée)
- **Page Détail Tournoi (Tab "Stream"):** Stream spécifique (si URL fournie par admin)

#### Phase 1.3 - Composants UI Critiques & Interactions Clés

**Composants UI Récurrents:**

1. **Navbar Publique:**
   - Logo
   - Liens : Accueil, Tournois, Stream, Contact
   - Bouton "Connexion" (→ Page segmentée Joueurs/Admins)
   - Si authentifié : Avatar + Menu déroulant (Profil, Déconnexion)

2. **Navbar Admin (Sidebar):**
   - Logo + Indication de rôle (SuperAdmin / Admin)
   - Menu items :
     - Dashboard
     - Tournois
     - [SuperAdmin] Sponsors
     - [SuperAdmin] Contenu Global
     - [SuperAdmin] Gestion Admins
   - Section utilisateur (Avatar, Nom, Déconnexion)

3. **Cards Tournois:**
   - Image/Bannière
   - Nom du tournoi
   - Date, Jeu
   - Badge de statut (Prévu/En Cours/Terminé)
   - Badge "Inscriptions Ouvertes/Fermées"
   - Bouton "Voir Détails"

4. **Formulaire Inscription Tournoi:**
   - Champs dynamiques (configurés par admin)
   - **Si Équipe:** Radio buttons "Créer équipe" / "Rejoindre équipe"
   - Validation en temps réel
   - Bouton "S'inscrire"

5. **Embed Twitch (Composant Réutilisable):**
   - URL dynamique (config SuperAdmin ou admin tournoi)
   - Responsive
   - Option chat intégré/caché

6. **Table Admin (Gestion Tournois/Équipes):**
   - Filtres/Recherche
   - Tri colonnes
   - Actions rapides (Icônes : Voir/Modifier/Supprimer)

7. **Formulaire CRUD Admin:**
   - Création/Édition Tournoi
   - Création/Édition Sponsor
   - Gestion Contenu Global
   - Validation inline

8. **Zone de Logs/Notifications (Dashboard Admin):**
   - Liste d'événements récents
   - Badges de priorité
   - Actions rapides (Approuver/Rejeter)

**Interactions Clés Identifiées:**

| Action Utilisateur | Écran Concerné | Comportement Attendu |
|-------------------|----------------|----------------------|
| **Clic "Connexion" (Public)** | Navbar Publique | Redirection vers Page Login segmentée (Partie "Joueurs") |
| **Clic "Admin" (Login)** | Page Login | Redirection vers Page Login segmentée (Partie "Admins") |
| **Login Discord Succès (Joueur)** | Page Login | Retour vers page d'origine OU Dashboard joueur si applicable |
| **Login Discord Succès (Admin)** | Page Login | Détection rôle → Redirection `/admin/dashboard` |
| **Clic "S'inscrire" (Non Auth)** | Tab Inscriptions | Modal "Connectez-vous" → Redirect Login → Retour Tab |
| **Toggle Draft ↔ Public** | Liste Tournois Admin | Mise à jour instantanée du statut (confirmation toast) |
| **Clic "Gérer Équipes"** | Modification Tournoi | Redirection `/admin/tournois/[id]/equipes` |
| **Kick Joueur** | Gestion Équipes | Confirmation modal → Suppression + toast succès |
| **Créer Équipe (Capitaine)** | Tab Inscriptions | Input "Nom équipe" → Validation → Équipe créée + Inscription auto |
| **Rejoindre Équipe** | Tab Inscriptions | Dropdown équipes disponibles → Sélection → Inscription |
| **Filtre Tournois (Public)** | Page Tournois | Filtrage temps réel (pas de rechargement page) |
| **Embed Twitch Load** | Landing/Stream/Détail | Lazy loading pour perf |

### Phase 2 - Stress Test UX (Reverse Brainstorming)

**Focus:** Identifier les scénarios d'échec, edge cases et features implicites manquantes.

#### 2.1 - Gestion des Équipes - Edge Cases

**Scénario 1 : Capitaine crée équipe mais ne s'inscrit jamais**
- **Comportement :** Équipe existe mais vide
- **Solution :** Admin peut supprimer les équipes abandonnées (nettoyage manuel)
- **Statut :** ✅ Géré (intervention admin)

**Scénario 2 : Kick du capitaine**
- **Comportement :** Le **2ème joueur inscrit** devient automatiquement capitaine
- **Règle Métier :** Succession automatisée pour éviter les équipes sans capitaine
- **Statut :** ✅ Défini (logique de promotion)

**Scénario 3 : Équipes incomplètes (ex: 2/5 joueurs)**
- **Comportement :** Autorisé, admin décide si l'équipe peut participer
- **Solution :** Validation manuelle par admin avant début tournoi
- **Statut :** ✅ Géré (décision admin)

**Scénario 4 : Équipe pleine (5/5 joueurs)**
- **Comportement :** Équipe marquée "Complète", non sélectionnable dans dropdown "Rejoindre"
- **V2 :** Waitlist automatisée (déjà identifiée)
- **Statut :** ✅ V1 : Affichage "Complet" | V2 : Waitlist

#### 2.2 - Inscriptions - Points de Friction

**Scénario 1 : Inscription à plusieurs tournois simultanés**
- **Comportement :** ✅ Autorisé (aucune restriction)
- **UX :** Historique joueur (V2) permettra de voir tous ses tournois

**Scénario 2 : Joueur dans plusieurs équipes (tournois différents)**
- **Comportement :** ✅ Totalement autorisé (cas d'usage principal)
- **Exemple :** Équipe Valorant pour Tournoi A, Équipe Rocket League pour Tournoi B

**Scénario 3 : Inscriptions fermées PENDANT le remplissage**
- **Comportement :** Validation timestamp côté serveur
- **Règle :** Si `timestamp_soumission > date_limite_inscription` → Erreur "Inscriptions fermées"
- **UX :** Toast d'erreur explicite
- **Statut :** ✅ Défini (validation serveur)

**Scénario 4 : Inscription en double**
- **Protection :** **Unique constraint** → `(user_email, tournament_id)` en base de données
- **UX :** Message "Vous êtes déjà inscrit à ce tournoi"
- **Statut :** ✅ Défini (contrainte DB)

#### 2.3 - Admin - Opérations Destructrices

**Scénario 1 : Suppression tournoi avec équipes inscrites**
- **Comportement :** **Cascade DELETE** → Tournoi supprimé = Équipes supprimées + Inscriptions supprimées
- **Protection :** Modal de confirmation "X équipes seront supprimées. Confirmer ?"
- **Statut :** ✅ Défini (cascade + confirmation)

**Scénario 2 : Modification champs dynamiques après inscriptions**
- **Règle Métier :** ❌ **INTERDIT** après publication du tournoi en "Public"
- **Protection :** UI désactive les champs dynamiques si `status = PUBLISHED` ET `inscriptions_count > 0`
- **Raison :** Intégrité des données déjà collectées
- **Statut :** ✅ Défini (verrouillage après publication)

**Scénario 3 : Changement Solo → Équipe après inscriptions**
- **Règle Métier :** ❌ **IMPOSSIBLE** - Format (Solo/Équipe) verrouillé à la création
- **Protection :** Champ `type_tournoi` non éditable après création initiale
- **Statut :** ✅ Défini (immutable field)

#### 2.4 - Authentification - Failles Potentielles

**Scénario 1 : Changement email Discord entre sessions**
- **Statut :** ⚠️ **QUESTION OUVERTE** - À creuser rapidement !
- **Pistes :**
  - Option A : Lier compte via Discord ID (immuable) plutôt qu'email
  - Option B : Système de synchronisation email Discord → Belouga
- **Priorité :** 🔴 **Critique** (impacte architecture auth)

**Scénario 2 : Un Discord → Plusieurs comptes Belouga**
- **Règle :** ❌ Interdit - **1 compte Discord = 1 compte Belouga**
- **Protection :** Unique constraint sur `discord_id` en base
- **Dual Role :** Un utilisateur peut être Joueur ET Admin simultanément (flag `is_admin`)
- **Statut :** ✅ Défini (compte unique, rôles multiples)

**Scénario 3 : Révocation admin (perte accès immédiate)**
- **Statut :** ⚠️ **QUESTION OUVERTE** - Mais priorité moindre ("projet bon vivre")
- **Pistes :**
  - Option A : Invalidation session + token refresh
  - Option B : Middleware vérifie rôle à chaque requête sensible
- **Priorité :** 🟡 **Moyenne** (sécurité mais edge case rare)

#### 2.5 - UI/UX - Frustrations Utilisateur

**Scénario 1 : Chargement Embed Twitch**
- **Solution :** **Skeleton loaders** via **shadcn/ui**
- **Implémentation :** Composants Skeleton pour tous les états de chargement (Twitch, Tables, Cards)
- **Statut :** ✅ Défini (shadcn skeleton)

**Scénario 2 : Profil joueur sans inscription**
- **Affichage :** Pseudo + Email Discord uniquement
- **UX :** Pas de section "Historique Tournois" (V2)
- **Statut :** ✅ Défini (affichage minimal)

**Scénario 3 : Accès URL tournoi draft**
- **Comportement :** Redirection vers **404 Not Found**
- **Règle :** Seuls les tournois `status = PUBLISHED` sont accessibles publiquement
- **Statut :** ✅ Défini (protection route + 404)

**Scénario 4 : Navigation post-inscription**
- **Comportement :** Email de confirmation envoyé → **Retour automatique** sur page détail tournoi
- **UX :** Toast de succès + Highlight tab "Inscriptions" (confirmation visuelle)
- **Statut :** ✅ Défini (flow de redirection)

### Phase 2.6 - Récapitulatif Règles Métier Identifiées

**Règles de Gestion des Équipes :**
1. Équipe complète (max joueurs atteint) → Non sélectionnable dropdown
2. Kick capitaine → Promotion automatique 2ème joueur
3. Équipes incomplètes → Validation manuelle admin

**Règles de Validation Inscriptions :**
1. Unique constraint : `(user_email, tournament_id)`
2. Validation timestamp serveur (fermeture inscriptions)
3. Inscriptions multiples tournois différents : Autorisé

**Règles d'Intégrité Admin :**
1. Champs dynamiques → Verrouillés après `PUBLISHED` + `inscriptions > 0`
2. Format tournoi (Solo/Équipe) → Immutable après création
3. Suppression tournoi → Cascade DELETE avec confirmation

**Règles d'Authentification :**
1. 1 Discord ID = 1 compte Belouga (multi-rôles possibles)
2. Email Discord change → ⚠️ **À définir**
3. Révocation admin immédiate → ⚠️ **À définir**

**Règles UX :**
1. Skeleton loaders partout (shadcn/ui)
2. Tournois draft → 404 si accès public direct
3. Post-inscription → Redirect détail tournoi + toast

---

## Phase 3 - Gap Analysis Final : Compilation & Priorisation

### 3.1 - Features Implicites Identifiées

**Features découvertes durant l'analyse mais non initialement spécifiées :**

#### V1 - Ajouts Critiques Identifiés :

1. **Système de Notifications Email**
   - Confirmation inscription tournoi
   - Changement statut tournoi (Annulation, Modification dates)
   - Kick d'une équipe (notification au joueur)
   - **Provider :** À définir (Resend, SendGrid, etc.)

2. **Gestion d'État des Équipes**
   - Flag "Complète" (max joueurs atteint)
   - Logique de succession capitaine (2ème → capitaine si kick)
   - Affichage "Équipes disponibles" uniquement si non complètes

3. **Protection Routes et Permissions**
   - Middleware auth pour routes `/admin/*`
   - Vérification rôle SuperAdmin pour routes `/admin/superadmin/*`
   - Tournois `DRAFT` inaccessibles publiquement (404)

4. **Modals de Confirmation (Admin)**
   - Suppression tournoi (avec count équipes inscrites)
   - Kick joueur
   - Dissolution équipe
   - Révocation admin

5. **Toast Notifications (UX)**
   - Succès : Inscription, Création équipe, Modification tournoi
   - Erreur : Inscriptions fermées, Déjà inscrit, Équipe complète
   - Info : Tournoi publié, Statut changé

6. **Skeleton Loaders (shadcn/ui)**
   - Chargement Embed Twitch
   - Chargement Tables admin
   - Chargement Cards tournois
   - Chargement Dashboard

7. **Filtrage et Tri (Temps Réel)**
   - Page Tournois Public : Filtre par statut, jeu, date
   - Page Admin Tournois : Filtre + recherche textuelle

8. **Validation Formulaires Client + Serveur**
   - Inscription tournoi (champs requis, formats email)
   - Création tournoi (dates cohérentes, champs obligatoires)
   - Création équipe (nom unique par tournoi ?)

#### V2 - Nice to Have (Reporté) :

1. **Waitlist Automatisée** (déjà identifié)
2. **CMS Global Complet** (déjà identifié)
3. **Historique Tournois Joueur** (profil enrichi)
4. **Statistiques Dashboard Admin** (graphs, analytics)
5. **Gestion Captain Power** (capitaine peut kick membres)
6. **Formulaire Contact** (page Contact)
7. **Système de Chat** (communication équipe)

### 3.2 - Questions Ouvertes Critiques (À Résoudre AVANT Implémentation)

> [!CAUTION]
> Les deux questions suivantes **DOIVENT** être résolues rapidement car elles impactent directement l'architecture d'authentification.

#### 🔴 Question 1 : Gestion Email Discord Changeant

**Problème :** Si un utilisateur change son email Discord, que se passe-t-il avec son compte Belouga ?

**Options :**

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A : Discord ID (Recommandé)** | Lier compte via `discord_id` (immuable) au lieu de `email` | ✅ Robuste, email peut changer sans impact | ❌ Nécessite requête API Discord pour récupérer email à jour |
| **B : Synchronisation Email** | Hook OAuth pour sync auto email Discord → Belouga à chaque login | ✅ Email toujours à jour | ❌ Complexité, dépendance OAuth flow |
| **C : Email Figé** | Email fixé à la 1ère connexion, changement Discord = nouveau compte | ✅ Simple | ❌ Mauvaise UX, perte historique |

**Recommandation :** **Option A** - Utiliser `discord_id` comme clé primaire d'identification. BetterAuth avec Discord provider fournit `providerAccountId` qui est le Discord ID.

**Implémentation BetterAuth :**
```typescript
// Structure User dans Prisma
model User {
  id            String   @id @default(cuid())
  discord_id    String   @unique  // providerAccountId from BetterAuth
  email         String   // Récupéré à chaque login (peut être mis à jour)
  username      String
  // ...
}
```

**Décision Validée :** ✅ **APPROUVÉ** - Option A confirmée. Permet aux joueurs de modifier leur email Discord sans impact sur le compte Belouga.

**Action Implémentation :** Utiliser `providerAccountId` (Discord ID) comme unique constraint pour l'identification des utilisateurs.

---

#### 🟡 Question 2 : Révocation Admin Immédiate

**Problème :** Comment garantir qu'un admin révoqué perd l'accès instantanément ?

**Options :**

| Option | Description | Complexité | Efficacité |
|--------|-------------|------------|------------|
| **A : Middleware Check** | Vérifier `is_admin` à chaque requête admin via middleware | 🟢 Faible | ✅ Immédiat |
| **B : Token Invalidation** | Invalider session + forcer refresh token | 🟡 Moyenne | ✅ Immédiat (avec refresh) |
| **C : RBAC Fine-Grained** | Permissions granulaires (SuperAdmin, Admin, User) | 🔴 Élevée | ✅ Très robuste |

**Recommandation :** **Option A (V1)** - Middleware Next.js vérifie `user.role` à chaque requête `/admin/*`. Simple et efficace pour MVP.

**Implémentation Next.js 16 (App Router) :**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const user = await getSession(); // BetterAuth session
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user || user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
}
```

**Décision Validée :** ✅ **APPROUVÉ** - Middleware Next.js pour vérification rôle confirmé.

**Action Implémentation :** Créer middleware auth dès le début du projet pour protection routes `/admin/*` avec vérification `user.role`.

### 3.3 - Priorisation V1 vs V2 - Vue Consolidée

#### ✅ V1 - MVP Prêt pour Implémentation :

**Fonctionnalités Core :**
- ✅ Authentification Discord (Joueurs + Admins, login segmenté)
- ✅ CRUD Tournois (Admin)
- ✅ Gestion Équipes (Admin : Kick, Dissolution)
- ✅ Inscription Tournois (Solo + Équipe)
- ✅ Affichage Public (Landing, Tournois, Détail, Stream)
- ✅ Profil Joueur (Minimal : Pseudo, Email)
- ✅ Intégration Toornament (Iframe bracket)
- ✅ Embed Twitch (Multi-emplacements)
- ✅ Gestion SuperAdmin (Sponsors, Contenu, Admins)

**Features Techniques V1 :**
- ✅ Notifications Email (Inscription, Kick)
- ✅ Skeleton Loaders (shadcn/ui)
- ✅ Protection Routes (Middleware)
- ✅ Modals Confirmation (Admin)
- ✅ Toast Notifications (Succès/Erreur)
- ✅ Filtrage/Tri Temps Réel
- ✅ Validation Client + Serveur
- ✅ Cascade DELETE (Tournois → Équipes)
- ✅ Verrouillage Champs (Post-publication)

**Règles Métier V1 :**
- ✅ Succession capitaine automatique
- ✅ Équipe complète → Non sélectionnable
- ✅ Unique constraint inscription
- ✅ Validation timestamp inscription
- ✅ Tournois draft → 404 public
- ✅ Format tournoi immutable

#### 🔜 V2 - Extensibilité Prévue :

- Waitlist Automatisée
- CMS Global (Multi-langues, Assets dynamic)
- Historique Tournois Joueur
- Captain Power (Self-management équipe)
- Statistiques Dashboard
- Formulaire Contact
- Chat Équipe

### 3.4 - Modèle de Données Implicite (Prisma Schema Hint)

**Entités Principales Identifiées :**

```
User (discord_id, email, username, role: PLAYER|ADMIN|SUPERADMIN)
  ├─ Teams (many-to-many via TeamMember)
  └─ Registrations (many tournois)

Tournament (name, dates, game, format: SOLO|TEAM, status: DRAFT|PUBLISHED)
  ├─ Teams (many)
  ├─ DynamicFields (JSON)
  └─ AdminAssignments (SuperAdmins assign Admins)

Team (name, captain_id, tournament_id, is_full)
  └─ TeamMembers (user_id, joined_at)

Sponsor (name, logo, link, superadmin_only)
GlobalContent (stream_url, socials, logo, superadmin_only)
```

**Contraintes Identifiées :**
- `@@unique([user_email, tournament_id])` → Inscription
- `@@unique([discord_id])` → User
- `@@unique([name, tournament_id])` → Team (nom unique par tournoi ?)
- `onDelete: Cascade` → Tournament → Teams → TeamMembers

### 3.5 - Checklist Pré-Implémentation

> [!IMPORTANT]
> Avant de commencer le développement, ces items **DOIVENT** être validés :

**Architecture & Auth :**
- [x] ✅ Confirmer BetterAuth + Discord Provider config (discord_id vs email) - **VALIDÉ : Option A (Discord ID)**
- [ ] Définir structure session (rôles, permissions)
- [x] ✅ Designer middleware auth (routes protégées) - **VALIDÉ : Middleware vérification rôle**

**Base de Données :**
- [ ] Créer Prisma schema complet (voir hint ci-dessus)
- [ ] Définir contraintes uniques et cascades
- [ ] Créer seed SuperAdmins initiaux

**Email Provider :**
- [ ] Choisir provider (Resend recommandé pour Next.js)
- [ ] Créer templates email (Confirmation inscription, Kick, etc.)

**UI Components (shadcn/ui) :**
- [ ] Installer shadcn/ui
- [ ] Préparer composants : Toast, Modal, Skeleton, Table, Form

**Questions Ouvertes :**
- [x] ✅ 🔴 Valider approche Discord ID vs Email - **RÉSOLU : Discord ID**
- [x] ✅ 🟡 Implémenter révocation admin (middleware) - **RÉSOLU : Middleware check**

---

## Session Summary and Insights - Gap Analysis UI/UX

**Key Achievements:**
- **Cartographie Exhaustive :** 8 écrans Admin + 7 pages Public + 8 composants UI + 12 interactions clés documentés
- **20+ Edge Cases Identifiés :** Tous les scénarios d'échec UX anticipés avec solutions
- **Règles Métier Formalisées :** Gestion équipes, inscriptions, intégrité admin, auth documentées
- **Features Implicites Révélées :** 15 features techniques identifiées (emails, toasts, skeletons, protection routes...)
- **Priorisation V1/V2 Claire :** Scope MVP stabilisé vs extensibilité prévue

**Critical Blockers Identified:**
1. 🔴 **Architecture Auth** : Discord ID vs Email → ~~Recommandation Option A (Discord ID)~~ **✅ RÉSOLU ET APPROUVÉ : Option A (Discord ID)**
2. 🟡 **Révocation Admin** : Middleware check → ~~Solution pragmatique V1~~ **✅ RÉSOLU ET APPROUVÉ : Middleware vérification rôle**

**Session Reflections:**
Cette session de Gap Analysis a transformé le brainstorming initial en **spécifications techniques prêtes pour l'implémentation**. L'inventaire exhaustif a révélé des dizaines de détails UI/UX et règles métier qui auraient pu bloquer le développement. Les deux questions critiques d'architecture d'authentification **ont été validées et approuvées** par l'équipe. **Le projet est maintenant totalement blindé contre les surprises** et 100% prêt pour la phase de développement.

**Décisions Architecturales Validées (2026-02-05) :**
- ✅ **Discord ID comme unique constraint** : Permet modification email Discord sans impact
- ✅ **Middleware auth avec vérification rôle** : Protection routes `/admin/*` dès le début

**Next Steps Recommandés :**
1. **Créer un PRD** (Product Requirements Document) formel basé sur ces analyses
2. **Créer un Design UX** (wireframes + maquettes) pour valider visuellement les écrans
3. **Créer une Architecture Technique** détaillée (Prisma schema, API routes, middleware)
4. **Lancer le développement** avec la certitude absolue d'avoir couvert tous les angles !

---

## Session Extension 2: Audit Pré-Implémentation

**Date:** 2026-02-05
**Focus:** Garantir la complétude du brainstorming avant DB design et implémentation.
**Techniques:** Question Storming, Constraint Mapping, Competitive Analysis

### Objectif de l'Extension

Identifier TOUT ce qui pourrait manquer avant de commencer la phase de développement. S'assurer qu'aucune décision architecturale critique n'est laissée au hasard.

---

## Technique 1/3 : Question Storming

**Méthodologie :** Générer toutes les questions non répondues dans 8 catégories critiques.

### 📊 Questions Identifiées (49 total)

#### Catégorie 1 : Base de Données & Modèle (8 questions)

1. Quel est le nom exact de chaque table Prisma ?
2. Les noms d'équipes doivent-ils être uniques globalement ou seulement par tournoi ?
3. Faut-il un soft delete (flag `deleted_at`) ou hard delete pour les tournois archivés ?
4. Comment gérer les champs dynamiques d'inscription ? (JSON field + validation ?)
5. Doit-on historiser les changements de capitaine d'équipe ? (Audit log ?)
6. Quel index créer pour optimiser la query "Tournois EN COURS" ?
7. Les sponsors ont-ils un ordre d'affichage (priority field) ?
8. Comment stocker les URLs des réseaux sociaux ? (JSON, table dédiée SocialLink ?)

#### Catégorie 2 : Sécurité & Authentification (6 questions)

9. Faut-il un système de CSRF tokens sur les formulaires admin ?
10. Comment protéger contre le spam d'inscriptions (rate limiting côté serveur ?) ?
11. Doit-on valider que l'email Discord est vérifié avant d'autoriser l'inscription ?
12. Comment gérer les sessions ? (JWT, session cookies, durée de validité ?)
13. Un SuperAdmin peut-il révoquer un autre SuperAdmin ?
14. Comment stocker les secrets (Discord Client Secret, Toornament API key) ? (.env.local, Vercel env vars ?)

#### Catégorie 3 : Emails & Notifications (6 questions)

15. Quel provider email choisir ? (Resend, SendGrid, AWS SES, autre ?)
16. Quels sont TOUS les emails à envoyer ? (Confirmation inscription, changement statut, kick... autres ?)
17. Faut-il un système d'unsubscribe pour les emails marketing vs transactionnels ?
18. Comment gérer les erreurs d'envoi email ? (Retry automatique, log, notification admin ?)
19. Les templates emails sont-ils en français uniquement ou multi-langues (V2) ?
20. Faut-il envoyer des notifications Discord (webhook bot) en plus des emails ?

#### Catégorie 4 : Assets & Stockage (6 questions)

21. Où stocker les images des tournois (bannières) ? (Vercel Blob, Supabase Storage, Cloudinary, simple URLs ?)
22. Où stocker les logos sponsors ? (Même endroit ?)
23. Quelle est la taille max autorisée pour un upload d'image ?
24. Quels formats d'image accepter ? (PNG, JPG, WebP, SVG ?)
25. Faut-il générer des thumbnails automatiquement ?
26. Comment gérer les images cassées (fallback image par défaut) ?

#### Catégorie 5 : Intégrations Externes (6 questions)

27. Que se passe-t-il si l'API Toornament est down pendant un tournoi live ?
28. Faut-il un fallback si le Toornament ID est invalide ? (Afficher quoi ?)
29. Le embed Twitch nécessite-t-il une API key ou juste l'URL du stream ?
30. Comment détecter si un stream Twitch est online/offline ?
31. Discord peut-il révoquer l'accès OAuth de Belouga ? (Comment gérer ça ?)
32. Faut-il synchroniser les équipes Discord avec les équipes Belouga ? (V2 ?)

#### Catégorie 6 : Limites & Scalabilité (6 questions)

33. Combien de tournois max un Admin peut-il gérer simultanément ?
34. Combien d'équipes max par tournoi ? (Hard limit technique ?)
35. Combien de joueurs max par équipe ? (Variable par tournoi, OK, mais limite globale ?)
36. Faut-il paginer la liste des tournois publics ? (Si oui, combien par page ?)
37. Les inscriptions doivent-elles se fermer automatiquement à une date OU quand limite atteinte ?
38. Quelle est la limite de connexions simultanées Supabase Free Plan ?

#### Catégorie 7 : Observabilité & Debugging (5 questions)

39. Comment logger les erreurs critiques ? (Console, Sentry, fichier ?)
40. Faut-il un endpoint `/api/health` pour monitoring ?
41. Comment tracer l'activité admin (audit log des actions) ?
42. Doit-on tracker les analytics utilisateurs ? (Google Analytics, Plausible, Vercel Analytics ?)
43. Comment débugger en production si un joueur signale un bug ?

#### Catégorie 8 : Business & Expérience (6 questions)

44. Un joueur peut-il modifier son inscription après validation ? (Champs dynamiques éditable ?)
45. Comment gérer les demandes de remboursement si tournoi payant (V2) ?
46. Faut-il afficher les statistiques globales (nombre total tournois, joueurs inscrits) sur la landing ?
47. Les règles du tournoi peuvent-elles être modifiées après publication ?
48. Peut-on dupliquer un tournoi (template pour recréer rapidement) ?
49. Faut-il un système de commentaires/questions sur les pages tournois ?

---

## Technique 2/3 : Constraint Mapping & Priorisation

**Méthodologie :** Trier les 49 questions en 3 niveaux de priorité et trancher les décisions CRITIQUES.

### 🔴 Décisions Critiques (14 tranchées)

| # | Sujet | Question | Décision Finale |
|---|-------|----------|-----------------|
| **Q1** | Tables Prisma | Quelles tables exactes ? | `User`, `Session`, `Account`, `Verification`, `Tournament`, `TournamentField`, `Team`, `TeamMember`, `TournamentRegistration`, `AdminAssignment`, `Sponsor`, `GlobalSettings` |
| **Q2** | Unicité équipes | Globale ou par tournoi ? | **Unique par tournoi** - Contrainte : `@@unique([name, tournamentId])` |
| **Q3** | Suppression tournois | Soft delete ou hard delete ? | **Archivage via statut** (DRAFT/PUBLISHED/ARCHIVED) - Pas de delete physique V1 |
| **Q4** | Champs dynamiques | Comment stocker les valeurs ? | **JSON dans `TournamentRegistration.fieldValues`** - Validation côté application (Zod) |
| **Q10** | Protection spam | Rate limiting nécessaire ? | **Unique constraint seulement** - 1 user = 1 inscription par tournoi. Pas de cooldown/rate limiting V1 |
| **Q12** | Sessions | Durée et storage ? | **7 jours, DB storage (BetterAuth)** - Remember me en V2, pas de Redis |
| **Q14** | Secrets | Où stocker les API keys ? | **`.env.local` (local) + Vercel Environment Variables (Preview/Production)** - 3 Discord redirect URLs (localhost, dev.belougatournament.ch, belougatournament.ch) |
| **Q15** | Email provider | Quel service ? | **Resend + React Email** - 100 emails/jour gratuit, excellent DX Next.js |
| **Q16** | Emails V1 | Quels emails envoyer ? | **4 emails transactionnels** : 1) Confirmation inscription, 2) Kick d'équipe, 3) Dissolution équipe, 4) Changement statut tournoi. Emails admin/superadmin → V2 |
| **Q21-22** | Images | Où stocker bannières/logos ? | **Vercel Blob Storage** - Pour tournois ET sponsors, 500MB gratuit, CDN auto |
| **Q27** | Fallback Toornament | Si API down ? | **Lien externe** - Afficher "Voir le bracket sur Toornament.com" si iframe fail |
| **Q29** | Embed Twitch | API key nécessaire ? | **Iframe basique** - Juste URL + paramètre `parent`, pas d'API Twitch V1. Détection online/offline → V2 |
| **Q37** | Fermeture inscriptions | Date OU limite ? | **Premier critère atteint** - `isOpen = (NOW < registrationDeadline) && (teamsCount < maxTeams)` |

### 🟡 Décisions Importantes (Documentées pour implémentation)

| # | Sujet | Décision |
|---|-------|----------|
| **Q5** | Historique capitaine | Non pour V1 - Succession automatique 2ème joueur, pas d'audit log |
| **Q6** | Index DB | À créer : Index sur `status`, `startDate`, `endDate` pour queries fréquentes |
| **Q7** | Ordre sponsors | Oui - Field `priority: Int` pour tri |
| **Q8** | Réseaux sociaux | JSON dans `GlobalSettings` (flexible, pas de table dédiée) |
| **Q9** | CSRF protection | Oui - Next.js middleware + tokens (standard) |
| **Q11** | Email Discord vérifié | Non pour V1 - Discord OAuth suffit |
| **Q13** | SuperAdmin révocation | Oui possible - Mais confirmation modale stricte |
| **Q17** | Unsubscribe emails | Non V1 - Emails transactionnels uniquement (pas marketing) |
| **Q18** | Erreurs email | Log dans console + async retry (1 tentative), pas de queue V1 |
| **Q19** | Multi-langues emails | Français uniquement V1 |
| **Q23** | Taille max upload | 5MB par image (raisonnable pour bannières/logos) |
| **Q24** | Formats images | PNG, JPG, WebP acceptés - SVG V2 (sécurité) |
| **Q26** | Fallback images | Image placeholder `/public/placeholder-tournament.png` |
| **Q28** | Toornament ID invalide | Message erreur + masquer iframe, afficher lien externe |
| **Q31** | Discord OAuth révocable | Oui possible - Géré par refresh token BetterAuth |
| **Q33** | Limite tournois/admin | Aucune limite V1 (trust-based) |
| **Q34** | Max équipes/tournoi | Défini par admin (`maxTeams`), pas de hard limit global |
| **Q36** | Pagination tournois | Oui si > 20 tournois - Infinite scroll ou pagination classique |
| **Q38** | Supabase connections | 60 connections simultanées (Free plan) - Largement suffisant V1 |
| **Q44** | Modification inscription | Non V1 - Joueur doit contacter admin. Édition champs → V2 |
| **Q46** | Stats landing page | Oui - Nombre total tournois organisés, joueurs inscrits (queries simples) |
| **Q47** | Modification règles post-pub | Oui autorisé - Mais warning modal "Tournoi déjà public" |

### 🟢 Décisions Reportées (V2)

- Q20: Notifications Discord webhook (V2)
- Q25: Thumbnails auto (V2 - Vercel Blob peut le faire)
- Q30: Détection stream Twitch online/offline (V2 - nécessite API)
- Q32: Sync équipes Discord ↔ Belouga (V2 - complexe)
- Q35: Limite joueurs/équipe (Déjà défini : variable par tournoi via `teamSize`)
- Q39-43: Observabilité complète (Sentry, health check, audit log, analytics) → V2
- Q45: Remboursements tournois payants (V2 - feature payante)
- Q48: Duplication tournois (V2 - nice to have)
- Q49: Commentaires pages tournois (V2 - engagement)

---

## Technique 3/3 : Competitive Analysis

**Méthodologie :** Analyser 3 plateformes concurrentes pour identifier features manquantes et opportunités de différenciation.

### 🏆 Plateformes Analysées

#### 1. Toornament (Utilisé pour brackets)

**✅ Forces :**
- API puissante et flexible
- Multi-formats (Single/Double elim, Round-robin, Swiss, League)
- Champs custom d'inscription
- White-label platform solution
- Pick & Ban intégré (Valorant, LoL)
- Check-in système (virtual/in-person)
- Multi-langues (7 langues)

**❌ Faiblesses :**
- Interface admin complexe (courbe d'apprentissage élevée)
- Features avancées payantes (boost tournaments)
- Branding Toornament visible (même en iframe)
- Pas de gestion stream native

**🔍 Features à considérer :**
- Pick & Ban (V2 si tournois Valorant/LoL)
- Check-in système (actuellement "Out of scope", mais utile anti-no-show)
- Player interface dédiée (gestion game accounts, historique)
- Duplicate tournament (identifié Q48, reporté V2)

---

#### 2. Challonge (Concurrent direct)

**✅ Forces :**
- Simplicité extrême (bracket en 2 min)
- 25+ formats de compétition
- Consolation matches (placements jusqu'à 16ème)
- Registration fees (Stripe integration)
- Multi-stage (group → playoffs)
- Community pages (organizer profile)
- Messaging intégré (DM, bulk, discussion boards)

**❌ Faiblesses :**
- Design daté (interface old-school)
- Limites participants (256-512 max)
- Pas de gestion stream
- Pas de sponsors

**🔍 Features à considérer :**
- ✅ **Consolation matches** : Définir 3ème/4ème place (important pour cashprize) → V2
- ✅ **Bulk participant import** : CSV import équipes → **AJOUTÉ V1** (voir ci-dessous)
- Elo rating system (V2 - classement global)
- Webhooks (V2 - notify external systems)

---

#### 3. Battlefy (Focus eSport)

**✅ Forces :**
- Scalabilité massive (30,000+ joueurs/event)
- Match Dispute Dashboard (gestion litiges pro)
- Activity Feed (audit trail complet "qui a fait quoi")
- Roles granulaires (Admin, Moderator, Bracket Manager)
- Region-locking
- Free agent pairing (auto-match joueurs solo)
- Join codes (tournois privés)
- Screenshot evidence (proof score reporting)
- Assisted score reporting (API Valorant)

**❌ Faiblesses :**
- Complexité enterprise
- Branding Battlefy très présent
- Pricing opaque

**🔍 Features à considérer :**
- 🔴 Dispute Resolution System → **NON V1** (géré manuellement si besoin)
- ✅ Activity Log/Audit Trail → V2 (Q41)
- Region-locking → Pas nécessaire (focus local)
- Free agent pairing → V2
- Screenshot evidence → Non (confiance admin)

---

### 🚨 Manque Critique Identifié : Export CSV Toornament

**Contexte :** Lors de l'analyse, identifié que Challonge et Battlefy permettent l'import CSV. Toornament aussi.

**Nouvelle Feature V1 :**

**Export CSV Équipes → Toornament**

- **Localisation :** Page `/admin/tournois/[id]/equipes`
- **Fonctionnalité :** Bouton "Exporter vers Toornament (CSV)"
- **Format :** CSV compatible avec l'import Toornament
  - Colonnes : Nom équipe, Email/Pseudo joueurs, Champs custom
  - Mapping champs Belouga → Toornament
- **Use Case :** Admin inscrit équipes sur Belouga, exporte CSV, importe dans Toornament pour créer le bracket
- **Implémentation :** API route `/api/admin/tournaments/[id]/export-csv`
- **Validation :** Vérifier format exact Toornament (consulter doc API)

> [!IMPORTANT]
> Cette feature crée le **bridge** entre Belouga (gestion inscriptions) et Toornament (gestion brackets). Critique pour le workflow admin.

---

### 🎯 Différenciation Belouga Tournament

**Ce que Belouga fait MIEUX que les concurrents :**

✅ **Intégration Stream Native** : Twitch embed central (landing, stream page, tournoi) - Aucun concurrent n'a ça  
✅ **Branding Immersif** : Landing fullscreen, identité forte (Paladins font, wall.png)  
✅ **Simplicité Ciblée** : Focus 100% use case (pas de bloat features inutiles)  
✅ **Sponsors First-Class** : Section sponsors dynamique (pas afterthought comme Challonge)  
✅ **Export CSV Toornament** : Bridge intelligent entre inscription et bracket

**Ce qui manquerait vs concurrents (assumé V2 ou Out of Scope) :**

- Multi-stage tournaments (group → playoffs)
- Check-in virtual anti-no-show
- Dispute resolution system
- Player stats/leaderboard global
- Multi-langues

---

## Récapitulatif Final : Décisions Architecturales

### 📊 Architecture Base de Données

**Tables Prisma V1 :**

```prisma
// Auth (BetterAuth)
User
Session
Account
Verification

// Tournois & Inscriptions
Tournament (status: DRAFT | PUBLISHED | ARCHIVED)
TournamentField (champs dynamiques config)
TournamentRegistration (fieldValues: Json)

// Équipes
Team (@@unique([name, tournamentId]))
TeamMember (many-to-many User ↔ Team)

// Admin & CMS
AdminAssignment (SuperAdmin → Admin → Tournament)
Sponsor (priority: Int pour ordre)
GlobalSettings (stream_url, socials: Json, logo)
```

**Contraintes Clés :**
- `@@unique([name, tournamentId])` sur `Team`
- `@@unique([email, tournamentId])` sur `TournamentRegistration` (anti-spam)
- `@@unique([discordId])` sur `User` (1 Discord = 1 compte)
- `onDelete: Cascade` sur `Tournament` → `Team` → `TeamMember`

**Index de Performance :**
- `Tournament`: Index sur `status`, `startDate`, `endDate`
- `TournamentRegistration`: Index sur `tournamentId`, `createdAt`

---

### 🔐 Sécurité & Authentification

**BetterAuth Configuration :**
- Provider : Discord OAuth
- Sessions : 7 jours, DB storage (table `Session`)
- Identification : `discord_id` (unique constraint, immuable)
- Email : Récupéré à chaque login (peut changer sans impact)

**Environnements :**
- **Local :** `.env.local` (git-ignored)
- **Preview :** Vercel env vars (dev.belougatournament.ch)
- **Production :** Vercel env vars (belougatournament.ch)

**Discord OAuth Redirect URLs :**
1. `http://localhost:3000/api/auth/callback/discord`
2. `https://dev.belougatournament.ch/api/auth/callback/discord`
3. `https://belougatournament.ch/api/auth/callback/discord`

**Middleware Protection :**
```typescript
// middleware.ts
if (request.nextUrl.pathname.startsWith('/admin')) {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return NextResponse.redirect('/unauthorized');
  }
}
```

**Anti-Spam :**
- Unique constraint DB : 1 user = 1 inscription par tournoi
- Pas de rate limiting V1 (approche trust-based)

---

### 📧 Emails & Notifications

**Provider :** Resend + React Email  
**Plan :** Gratuit (100 emails/jour)

**Templates V1 (4 emails transactionnels) :**

1. **Confirmation Inscription**
   - Trigger : Après inscription réussie
   - Destinataire : Joueur inscrit
   - Contenu : Détails tournoi, équipe, date, lien règles

2. **Kick d'Équipe**
   - Trigger : Admin kick joueur
   - Destinataire : Joueur kické
   - Contenu : Nom tournoi, raison (optionnel), contact admin

3. **Dissolution Équipe**
   - Trigger : Admin dissout équipe complète
   - Destinataire : Tous les membres
   - Contenu : Nom tournoi, raison, contact admin

4. **Changement Statut Tournoi**
   - Trigger : Annulation ou report de dates
   - Destinataire : Tous les inscrits
   - Contenu : Nouveau statut, nouvelles dates (si applicable)

**Gestion Erreurs :**
- Log erreurs envoi dans console
- 1 retry async automatique
- Pas de dead letter queue V1

**Multi-langues :** Français uniquement V1

---

### 🖼️ Assets & Stockage

**Vercel Blob Storage :**
- Bannières tournois (champ `Tournament.bannerUrl`)
- Logos sponsors (champ `Sponsor.logoUrl`)
- Plan gratuit : 500MB

**Limites Uploads :**
- Taille max : 5MB par image
- Formats acceptés : PNG, JPG, WebP
- SVG reporté V2 (sécurité)

**Fallbacks :**
- Image cassée → `/public/placeholder-tournament.png`
- Logo sponsor cassé → `/public/placeholder-sponsor.png`

---

### 🔗 Intégrations Externes

**Toornament (Brackets) :**
- Intégration : Iframe `<iframe src="https://widget.toornament.com/..." />`
- Fallback si down : Lien "Voir sur Toornament.com"
- Toornament ID invalide : Message erreur + masquer iframe
- **Export CSV** : Bouton admin pour exporter équipes → format Toornament

**Twitch (Streaming) :**
- Intégration : Iframe basique `<iframe src="https://player.twitch.tv/?channel=..." />`
- Paramètre `parent` : `belougatournament.ch`, `dev.belougatournament.ch`
- Pas d'API Twitch V1 (détection online/offline → V2)

**Discord (OAuth) :**
- Provider : BetterAuth Discord
- Scopes : `identify`, `email`
- Révocation possible : Géré via refresh token BetterAuth

---

### ⚙️ Règles Métier V1

**Fermeture Inscriptions :**
```typescript
const isOpen = (NOW < registrationDeadline) && (teamsCount < maxTeams);
```
Premier critère atteint ferme les inscriptions.

**Succession Capitaine :**
Si admin kick capitaine → 2ème joueur inscrit devient capitaine auto.

**Équipes Incomplètes :**
Autorisées, admin décide validation avant tournoi.

**Modification Post-Publication :**
- Règles tournoi : Modifiables avec warning modal
- Champs dynamiques : **Verrouillés** si tournoi publié + inscriptions > 0
- Format tournoi (Solo/Équipe) : **Immutable** après création

**Suppression Tournoi :**
- Pas de delete physique V1
- Archivage via `status = ARCHIVED`
- Modal confirmation si équipes inscrites

---

## Session Summary and Insights - Audit Pré-Implémentation

**Key Achievements:**

- **Exhaustivité Garantie :** 49 questions identifiées, 14 décisions critiques tranchées
- **Aucune Zone Grise :** Toutes les incertitudes architecturales résolues (DB, auth, emails, assets, intégrations)
- **Analyse Concurrentielle :** 3 plateformes analysées, 1 feature critique ajoutée (Export CSV Toornament)
- **Priorisation Claire :** V1 vs V2 stabilisé, aucune feature "maybe" non tranchée

**Critical Decisions Made:**

1. ✅ **Architecture DB complète** : 12 tables Prisma, contraintes, index définis
2. ✅ **Stack confirmée** : Resend emails, Vercel Blob, BetterAuth 7j sessions
3. ✅ **Sécurité validée** : Middleware auth, Discord ID immuable, unique constraints
4. ✅ **Intégrations clarifiées** : Toornament fallback, Twitch iframe basique, Export CSV bridge
5. ✅ **Règles métier formalisées** : Fermeture inscriptions, succession capitaine, verrouillages post-pub

**New Feature Identified:**

🆕 **Export CSV Équipes → Toornament** : Bridge intelligent entre gestion inscriptions (Belouga) et gestion brackets (Toornament). Feature critique pour workflow admin V1.

**Session Reflections:**

Cette session d'audit a transformé un brainstorming déjà très complet en un **cahier des charges 100% prêt pour l'implémentation**. Chaque question architecturale a été tranchée, chaque incertitude résolue. L'analyse concurrentielle a confirmé que Belouga Tournament se différencie par son **intégration stream native**, son **branding immersif**, et sa **simplicité ciblée**.

**Le projet est maintenant TOTALEMENT blindé. Zero surprise possible pendant le développement.**

**Next Steps Recommandés :**

1. ✅ **Créer le Prisma Schema** basé sur les 12 tables définies
2. ✅ **Setup BetterAuth** avec Discord provider (3 redirect URLs)
3. ✅ **Setup Resend** et créer les 4 templates React Email
4. ✅ **Setup Vercel Blob** pour uploads images
5. ✅ **Implémenter Middleware** auth dès le début
6. 🚀 **Lancer le développement** avec confiance totale !
