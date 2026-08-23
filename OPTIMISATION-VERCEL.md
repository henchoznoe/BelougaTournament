# Plan d’optimisation Vercel — BelougaTournament

> Audit réalisé le 23 août 2026 à partir du tableau de bord Vercel Hobby, du code de BelougaTournament et du code d’Arbeaute. Ce document est un plan de réalisation : aucune optimisation décrite ci-dessous n’est encore considérée comme implémentée.

## Objectif

Réduire en priorité le CPU actif des fonctions et les écritures ISR de BelougaTournament, sans dégrader l’authentification, les inscriptions, les paiements, la fraîcheur des données ni la sécurité de l’administration.

L’objectif réaliste après stabilisation est de ramener BelougaTournament de **58 min 14 s à 20 min ou moins de CPU actif sur 30 jours**, puis de confirmer la tendance sur un cycle complet de facturation. Les optimisations d’images, de transfert et de JavaScript sont secondaires, car ces quotas sont actuellement beaucoup moins sollicités.

## État des lieux

### Mesures Vercel observées

| Mesure | BelougaTournament | Arbeaute | Lecture |
| --- | ---: | ---: | --- |
| CPU actif, 30 jours | 58 min 14 s, 58,4 % du compte | 18 min 29 s, 18,5 % | Belouga consomme environ 3,1 fois plus de CPU |
| Requêtes Edge, 30 jours | 59 039 | 57 084 | Trafic comparable ; le trafic seul n’explique pas l’écart CPU |
| Transformations d’images, 30 jours | 167 | 294 | Ce n’est pas le poste critique de Belouga |
| Invocations de fonctions, 12 h | 51 | 11 | Les routes publiques de Belouga exécutent encore du code serveur |
| CPU P75, 12 h | 764 ms | 885 ms | Le problème principal est le nombre et la nature des exécutions, pas seulement leur latence unitaire |
| Mémoire moyenne, 12 h | 300 Mo | 311 Mo | Pas d’anomalie mémoire propre à Belouga |
| Démarrages à froid, 12 h | 49 % | 63,6 % | À surveiller, mais pas la cause principale |
| Écritures ISR, 12 h | 216 unités | 9 unités | Écart majeur et directement actionnable |
| Revalidations temporelles, 12 h | 50 | 3 | Les caches horaires de Belouga régénèrent trop souvent |
| Lectures ISR, 12 h | 96 unités | 272 unités | Arbeaute sert davantage de contenu depuis le cache tout en écrivant beaucoup moins |

Sur la fenêtre de 12 heures inspectée, les 51 invocations de Belouga provenaient de la production et aucune de Preview. Il faudra refaire cette séparation sur plusieurs fenêtres : le quota d’équipe sur 30 jours agrège tous les environnements.

### Routes les plus coûteuses observées sur 12 heures

| Route | Invocations | CPU actif cumulé |
| --- | ---: | ---: |
| `/` | 19 | 11 s |
| `/tournaments` | 2 | 1,75 s |
| segment RSC de `/stream` | 2 | 1,51 s |
| `/sitemap.xml` | 2 | 1,29 s |
| `/privacy` | 2 | 1,24 s |
| segment RSC de `/players` | 2 | 1,07 s |
| segment RSC de `/tournaments/[slug]` | 2 | 950 ms |

La présence de `/privacy` et du sitemap dans cette liste est révélatrice : du contenu intrinsèquement statique paie actuellement un coût de fonction.

### Différence structurelle confirmée dans les builds locaux

Les manifestes de pré-rendu existants montrent :

- BelougaTournament : `/`, `/privacy`, `/tournaments`, `/players` et `/stream` sont en `compute: "resuming"`, avec une revalidation toutes les **3 600 secondes** et une expiration à 86 400 secondes ;
- Arbeaute : `/` et `/prestations` sont en `compute: "static"`, avec une revalidation à **2 592 000 secondes** et une expiration à 31 536 000 secondes ;
- le sitemap d’Arbeaute est statique et mis en cache ; celui de Belouga n’apparaît pas dans le manifeste de pré-rendu inspecté.

Autrement dit, Belouga possède bien un shell PPR, mais reprend du calcul dynamique à chaque visite et régénère ses données stables toutes les heures. Arbeaute sert réellement ses pages publiques depuis le CDN et invalide les données lors d’une modification métier.

## Diagnostic priorisé

| Priorité | Cause | Preuve dans le code | Impact attendu |
| --- | --- | --- | --- |
| P0 | Toutes les lectures mises en cache utilisent principalement `cacheLife('hours')` ou `cacheLife('minutes')` | `lib/services/*.ts` | Suppression de la majorité des 50 revalidations temporelles sur 12 h |
| P0 | La session est lue dans le layout public et jusqu’à quatre fois sur l’accueil | `public-navbar.tsx`, `ban-banner.tsx`, deux wrappers dans `app/(public)/page.tsx` | Réduction forte du CPU de `/` et passage des pages anonymes vers un rendu statique |
| P0 | Le tag global `TOURNAMENTS` invalide presque toutes les données tournoi lors de mutations très locales | 16 caches abonnés, 27 invalidations relevées | Réduction du nombre de pages et entrées ISR réécrites après une inscription |
| P0 | Le sitemap interroge Prisma directement sans cache explicite | `app/sitemap.ts` | Suppression du coût récurrent observé sur `/sitemap.xml` |
| P1 | Le cache d’images n’est pas configuré et plusieurs images fixes n’ont pas de `sizes` précis | `next.config.ts`, composants avec `next/image` | Moins de variantes et de transformations après expiration |
| P1 | Le layout public charge Font Awesome, Framer Motion et PostHog sur toutes les pages | `app/layout.tsx` et composants publics | Réduction du JavaScript, du transfert et du travail navigateur |
| P1 | PostHog passe par le domaine Vercel avec `/ingest` et est activé sur les previews si la clé y existe | `next.config.ts`, `instrumentation-client.ts` | Moins de requêtes Edge et de transfert via Vercel |
| P1 | Chaque build exécute migrations et seed admin | `package.json` | Moins de travail de build et de connexions/écritures DB inutiles |
| P2 | Le proxy admin appelle une fonction interne pour vérifier chaque session | `proxy.ts` | Une exécution de moins par navigation admin si une vérification locale sûre est possible |
| P2 | Les fonctions sont en `iad1` ; la région de la base n’a pas encore été rapprochée | Réglage Vercel Functions | Latence et durée murale potentiellement réduites, sans garantie sur le CPU actif |

## Plan de réalisation

### Phase 0 — Installer les garde-fous avant de modifier le cache

- [ ] Créer `scripts/verify-build-quality.ts`, sur le modèle d’Arbeaute mais avec des contrôles plus stricts.
- [ ] Lire `.next/prerender-manifest.json` après le build et échouer si une route anonyme attendue repasse en calcul dynamique.
- [ ] Exiger `compute: "static"` pour `/`, `/contact`, `/legal`, `/privacy`, `/terms`, `/stream` et, après refonte de la session, `/players` et `/tournaments`.
- [ ] Exiger une revalidation d’au moins 30 jours pour les pages qui ne dépendent que de données invalidées par tag.
- [ ] Vérifier que `/sitemap.xml` figure dans le manifeste statique.
- [ ] Ajouter des budgets JavaScript et images. Valeurs initiales proposées : 400 Kio pour les pages publiques simples, 475 Kio pour `/tournaments`, 256 Kio maximum par image publique et 700 Kio pour l’ensemble des images statiques après compression.
- [ ] Ajouter le script de vérification à la fin du build Next, après avoir séparé les opérations de base de données décrites en phase 7.
- [ ] Conserver dans ce document une capture de référence des métriques Vercel avant le premier déploiement optimisé.

**Critère de fin :** un changement futur qui rend `/privacy` ou l’accueil dynamique, raccourcit involontairement leur TTL ou dépasse les budgets doit faire échouer le build.

### Phase 1 — Supprimer les régénérations horaires inutiles

#### 1.1 Données stables invalidées à l’écriture

- [ ] Passer de `cacheLife('hours')` à `cacheLife('max')` pour les données qui ne changent qu’après une mutation contrôlée :
  - `getGlobalSettings()` dans `lib/services/settings.ts` ;
  - les trois lectures de sponsors dans `lib/services/sponsors.ts` ;
  - `getPublicStats()` dans `lib/services/public-stats.ts` ;
  - les listes et détails publics de tournois dans `lib/services/tournaments-public.ts` ;
  - les listes et profils publics dans `lib/services/players.ts`, après couverture complète des invalidations ;
  - les lectures admin pour lesquelles toutes les actions ont une invalidation fiable.
- [ ] Ne pas effectuer de remplacement global aveugle. Documenter pour chaque fonction : source de vérité, tag, mutations qui l’invalident et éventuelle dépendance à l’heure courante.
- [ ] Garder un TTL temporel uniquement pour une valeur réellement dérivée du temps et impossible à recalculer côté client.
- [ ] Pour le badge du prochain tournoi, mettre en cache la liste des tournois avec `max` et continuer à recalculer l’état « à venir/en cours » côté client. Le composant possède déjà le minuteur nécessaire ; il ne faut pas régénérer la page chaque heure pour cette horloge.

#### 1.2 Sitemap

- [ ] Extraire la requête Prisma de `app/sitemap.ts` vers une lecture `server-only` dans `lib/services/`.
- [ ] Mettre cette lecture en `use cache`, `cacheLife('max')` et l’abonner au tag de liste des tournois publiés/archivés.
- [ ] Mettre le sitemap lui-même en `use cache` avec `cacheLife('days')`, comme Arbeaute.
- [ ] Ne conserver `lastModified` que lorsqu’il correspond à une modification métier réelle.
- [ ] Ajouter un test vérifiant les routes fixes, les slugs et l’invalidation après publication, archivage ou suppression.

**Critères de fin :**

- `initialRevalidateSeconds` vaut au moins 2 592 000 secondes pour les pages stables ;
- les revalidations temporelles ISR deviennent proches de zéro hors changement métier ;
- `/sitemap.xml` n’apparaît plus dans les fonctions coûteuses.

### Phase 2 — Rendre le shell public réellement statique

Cette phase est le levier CPU principal. Elle doit préserver la personnalisation sans jamais mettre une session en cache partagé.

#### 2.1 Gain immédiat et peu risqué

- [ ] Envelopper `getSession()` avec `cache()` de React pour dédupliquer la lecture **dans une même requête**.
- [ ] Ne surtout pas ajouter `'use cache'`, `cacheLife()` ou `cacheTag()` autour d’une session : cela risquerait de partager des données entre utilisateurs.
- [ ] Ajouter un test qui appelle plusieurs fois `getSession()` pendant le même rendu et confirme une seule lecture Better Auth.

Aujourd’hui, une visite de l’accueil peut appeler la session depuis :

1. la navbar ;
2. la bannière de bannissement ;
3. le hero ;
4. le CTA final ;
5. le provider PostHog côté client effectue en plus sa propre lecture via `authClient.useSession()`.

#### 2.2 Session publique unique côté client

- [ ] Créer un provider public léger qui appelle `authClient.useSession()` une seule fois et partage l’état avec la navbar, le hero, le CTA et l’identification PostHog.
- [ ] Rendre le HTML anonyme de la navbar, du hero et du CTA statique, puis hydrater uniquement leur petite variante authentifiée.
- [ ] Retirer `getSession()` de `PublicNavbar`, `HeroSectionWrapper` et `FinalCtaWrapper`.
- [ ] Éviter quatre hooks de session indépendants : le provider doit rester monté lors des navigations App Router.
- [ ] Charger l’état de bannissement uniquement après confirmation d’une session authentifiée, via une action ou route dédiée, avec validation et réponse minimale.
- [ ] Garder `/profile`, `/admin` et les mutations explicitement dynamiques.

#### 2.3 Détails de tournoi

- [ ] Séparer les données publiques du tournoi de `getUserTournamentRegistrationState()`.
- [ ] Servir le détail public, les équipes et les inscrits depuis le cache statique.
- [ ] Charger l’état d’inscription personnel uniquement pour un utilisateur connecté.
- [ ] Envisager `generateStaticParams()` pour les slugs publiés et archivés afin d’éviter le premier rendu à la demande après un déploiement.
- [ ] Vérifier que les retours Stripe et les formulaires d’inscription restent fonctionnels après cette séparation.

**Critères de fin :**

- les routes anonymes contrôlées sont en `compute: "static"`, et non plus `resuming` ;
- une visite anonyme de `/privacy` ne crée aucune invocation de fonction ;
- une visite anonyme de `/` ne fait aucun accès Better Auth/Prisma ;
- un utilisateur connecté voit toujours son avatar, son CTA, son bannissement éventuel et son état d’inscription exact.

### Phase 3 — Remplacer le tag global `TOURNAMENTS` par des invalidations ciblées

Le tag actuel relie listes, détails, équipes, inscrits, profils et statistiques. Une inscription locale peut donc invalider une grande partie du site et provoquer plusieurs écritures ISR.

- [ ] Ajouter des fabriques de tags dans `lib/config/constants/cache.ts`, par exemple :
  - `tournaments:published` et `tournaments:archived` ;
  - `tournament:<id>` ;
  - `tournament:<id>:registrants` ;
  - `tournament:<id>:teams` ;
  - `user:<id>:registrations` ;
  - `players:list` et `player:<id>` ;
  - `stats:public`.
- [ ] Conserver temporairement le tag global pendant la migration, puis le retirer lorsque la matrice est couverte.
- [ ] Centraliser les groupes d’invalidation dans de petits helpers métier pour éviter les listes de quatre à huit `updateTag()` recopiées dans chaque action.
- [ ] Utiliser `updateTag()` dans les Server Actions et `revalidateTag()` avec un profil explicite dans les route handlers/webhooks, conformément aux API autorisées dans chaque contexte.

#### Matrice d’invalidation attendue

| Mutation | Caches à invalider | Caches à ne pas invalider |
| --- | --- | --- |
| Modifier les réglages globaux | `settings` | tournois, joueurs, sponsors |
| Modifier un sponsor | `sponsors` | tournois et statistiques joueurs |
| Créer/modifier/publier/archiver un tournoi | détail concerné, listes de statut, hero, sitemap, statistiques | profils sans lien avec le tournoi |
| Inscrire/annuler/rembourser un joueur | inscrits/équipes du tournoi, inscription de l’utilisateur, statistiques | liste globale et contenu éditorial de tous les autres tournois |
| Modifier la visibilité d’un profil | liste joueurs et profil concerné | sponsors, réglages, tournois sans compteur affecté |
| Modifier un logo d’équipe | équipe et détail du tournoi concerné | liste des tournois et autres équipes |
| Expirer une inscription Stripe | inscription utilisateur, tournoi concerné, statistiques/paiements admin | tous les détails de tournoi sans lien |

- [ ] Tester chaque ligne avec des mocks de cache et vérifier à la fois les tags présents et les tags absents.
- [ ] Vérifier spécialement les invalidations issues du webhook Stripe, de l’upload Blob et de `cleanupExpiredPendingRegistrations()`.

**Critère de fin :** une inscription sur un tournoi ne doit plus invalider toutes les pages de tournois, tous les profils et toutes les entrées admin.

### Phase 4 — Réduire le travail des fonctions restantes

- [ ] Mettre en cache ou dédupliquer `getPlayerProfileStatus()`, appelé par `generateMetadata()` puis par la page profil public.
- [ ] Réutiliser une même promesse lorsque metadata et page demandent la même entité.
- [ ] Examiner les requêtes de l’accueil après suppression du rendu dynamique. `getPublicStats()` lance quatre requêtes, ce qui est acceptable sur un cache miss rare mais pas à chaque heure.
- [ ] Vérifier que `cleanupExpiredPendingRegistrations()` n’est appelé que pour un utilisateur connecté et qu’il n’invalide que les caches liés aux inscriptions effectivement expirées.
- [ ] Mesurer les importations des fonctions avec le Build Diagnostics Vercel. Garder Prisma, Stripe, Resend, PostHog Node et les éditeurs riches hors des bundles qui n’en ont pas besoin.
- [ ] Étudier la vérification de session du proxy admin : remplacer l’appel HTTP interne à `/api/auth/get-session` uniquement si Better Auth permet une vérification cryptographique locale au runtime Edge sans réduire la sécurité. Sinon, conserver le double garde-fou existant.
- [ ] Identifier la région réelle de PostgreSQL avant tout changement Vercel. Si la base est en Europe, tester `fra1`, `cdg1` ou la région exacte de la base au lieu de `iad1`, puis comparer TTFB, durée et erreurs. Ne pas changer la région à l’aveugle.

### Phase 5 — Stabiliser le coût des images

Cette phase est utile mais ne doit pas retarder les phases CPU/ISR : Belouga ne représente que 167 des 771 transformations du compte sur 30 jours.

- [ ] Ajouter dans `next.config.ts` un `minimumCacheTTL` d’un an, comme Arbeaute, pour les URLs immuables de Vercel Blob et Discord.
- [ ] Vérifier avant cela qu’un remplacement d’image produit toujours une nouvelle URL ; une URL mutable ne doit pas recevoir un TTL annuel sans stratégie de versionnement.
- [ ] Définir `imageSizes` et `deviceSizes` à partir des largeurs réellement rendues, au lieu de conserver toute l’échelle par défaut.
- [ ] Ajouter un `sizes` précis à toutes les images responsives ou fixes, notamment les avatars, logos de sponsors, navbar/footer, cartes et vues admin.
- [ ] Marquer `unoptimized` uniquement les petites icônes/images déjà correctement dimensionnées lorsque le gain d’optimisation serait inférieur au coût d’une transformation.
- [ ] Compresser `public/assets/wall.png` (environ 938 Kio) vers WebP/AVIF et `logo-blue.png` (environ 170 Kio) vers une version plus légère, avec contrôle visuel.
- [ ] Éviter de multiplier artificiellement les variantes d’un même logo dans le marquee sponsors.
- [ ] Ajouter au script de qualité le budget individuel et total des images statiques.

**Critère de fin :** après le premier réchauffement du cache, les mêmes images ne doivent plus générer de transformations périodiques et les nouvelles variantes doivent correspondre à des tailles réellement affichées.

### Phase 6 — Réduire le JavaScript et les requêtes d’observabilité

Les manifestes actuels indiquent environ :

| Route | Belouga | Arbeaute comparable |
| --- | ---: | ---: |
| Accueil | 441 Kio | 347 Kio |
| Liste principale | 460 Kio pour `/tournaments` | 358 Kio pour `/prestations` |
| Page simple | 415 Kio pour `/privacy` | 348 Kio pour `/contact` |

- [ ] Remplacer les cinq icônes de réseaux sociaux Font Awesome par de petits SVG locaux, comme Arbeaute.
- [ ] Retirer `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-brands-svg-icons`, `@fortawesome/react-fontawesome` et l’import CSS global lorsque plus aucun usage ne subsiste.
- [ ] Remplacer les animations publiques simples de Framer Motion par CSS ou un petit composant Intersection Observer. Conserver Framer uniquement là où l’interaction le justifie réellement.
- [ ] Charger PostHog paresseusement et éviter de faire de son provider un coût obligatoire pour chaque page si l’identification n’est pas nécessaire.
- [ ] Désactiver la clé PostHog dans Preview, sauf campagne de test explicitement mesurée.
- [ ] Décider si la résistance aux bloqueurs vaut le coût du reverse proxy `/ingest`. Une connexion directe à `eu.i.posthog.com`, avec CSP adaptée, retire ces événements des requêtes Edge Vercel mais augmente le risque de blocage analytique.
- [ ] Évaluer la désactivation ou l’échantillonnage du session replay et des autocaptures PostHog ; garder les événements métier utiles.
- [ ] Conserver Vercel Analytics et Speed Insights pendant la mesure avant/après. Réévaluer Speed Insights seulement après stabilisation ; son quota est actuellement loin de la limite.
- [ ] Fixer les budgets JavaScript après le premier allègement, puis les rendre bloquants dans le build.

**Critère de fin :** atteindre au minimum le niveau d’Arbeaute sur les pages simples et supprimer les requêtes `/ingest` de Vercel si le proxy PostHog est abandonné.

### Phase 7 — Rendre les déploiements moins coûteux et plus sûrs

- [ ] Retirer `tsx prisma/seed.ts` de `pnpm build`. Le seed admin effectue actuellement un `upsert` par adresse à chaque déploiement, y compris les previews.
- [ ] Conserver un script explicite `pnpm db:seed` pour le provisionnement intentionnel.
- [ ] Séparer idéalement :
  1. build pur : `prisma generate`, `next build`, vérification qualité ;
  2. déploiement DB : `prisma migrate deploy` ;
  3. seed : commande manuelle/initiale.
- [ ] Si la migration reste temporairement dans le build, l’exécuter uniquement dans le contexte voulu et jamais contre une base partagée depuis une preview non maîtrisée.
- [ ] Vérifier que Production, Preview et Development ont des bases et secrets correctement séparés avant de modifier le workflow.
- [ ] Ajouter une étape de migration dédiée au workflow de release, avec échec bloquant avant promotion en production.
- [ ] Configurer un « Ignored Build Step » Vercel pour les changements de documentation ou fichiers sans impact déployable, tout en conservant les previews utiles des PR applicatives.
- [ ] Ne pas exposer la clé PostHog aux previews par défaut.

**Critère de fin :** un déploiement ordinaire ne modifie plus les rôles admin et ne lance pas de seed ; les migrations restent explicites, traçables et exécutées une seule fois dans le bon environnement.

### Phase 8 — Déploiement progressif et mesure

Déployer les optimisations en lots isolés afin d’attribuer les gains et de faciliter un retour arrière.

1. [ ] Garde-fous de build et cache du sitemap.
2. [ ] `cacheLife('max')` pour réglages, sponsors et statistiques.
3. [ ] Déduplication serveur de `getSession()`.
4. [ ] Shell public statique et provider de session client unique.
5. [ ] Tags de cache granulaires.
6. [ ] Images et assets.
7. [ ] JavaScript/PostHog.
8. [ ] Pipeline de build et réglages Vercel.

Après chaque lot :

- [ ] vérifier type-check, Biome, Knip, tests et couverture ;
- [ ] inspecter le manifeste de pré-rendu généré ;
- [ ] tester anonymement puis connecté : accueil, navbar, profil, bannissement, détail/inscription tournoi, retour Stripe, admin ;
- [ ] comparer Production et Preview séparément dans Vercel ;
- [ ] relever à 12 h : invocations, CPU actif, routes, écritures/lectures ISR, revalidations temporelles et erreurs ;
- [ ] relever à 7 jours puis 30 jours : part CPU de Belouga, requêtes Edge, Fast Origin Transfer et transformations d’images.

## Cibles de validation

| Indicateur | Référence | Cible après stabilisation |
| --- | ---: | ---: |
| CPU actif Belouga, 30 jours | 58 min 14 s | ≤ 20 min, puis tendre vers le niveau d’Arbeaute |
| Part du CPU actif du compte | 58,4 % | ≤ 25 % à trafic comparable |
| Revalidations temporelles, 12 h inactive | 50 | 0 à 5 |
| Écritures ISR, 12 h inactive | 216 unités | ≤ 20 unités, idéalement proches d’Arbeaute |
| Invocations anonymes `/privacy` | présentes | 0 |
| Calcul de `/` anonyme | `resuming` | `static` |
| CPU cumulé de `/` sur 12 h | 11 s | baisse d’au moins 70 % |
| JavaScript accueil | 441 Kio | ≤ 360–400 Kio |
| Transformations Belouga, 30 jours | 167 | tendance baissière après réchauffement, sans variantes inutiles |

Les comparaisons doivent être corrigées du trafic et des déploiements. Une baisse ponctuelle sur une fenêtre sans visiteurs ne valide pas une optimisation.

## Risques et règles à respecter

- **Confidentialité :** ne jamais placer session, rôle, bannissement ou état d’inscription utilisateur dans un cache partagé. Utiliser `cache()` pour la déduplication par requête, pas `'use cache'`.
- **Données périmées :** ne passer à `cacheLife('max')` qu’après avoir prouvé la couverture des mutations et webhooks par tags.
- **Paiements :** tester succès, annulation, expiration et remboursement Stripe ; une invalidation manquante peut afficher une place ou un paiement obsolète.
- **Temps réel métier :** les compteurs et badges dépendant de l’heure doivent être recalculés côté client ou garder un TTL justifié.
- **Sécurité admin :** ne supprimer ni le proxy ni l’`AdminGuard` sans mécanisme de remplacement équivalent et testé.
- **Images :** un TTL d’un an suppose des URLs immuables/versionnées.
- **PostHog :** supprimer le proxy améliore les quotas Vercel mais réduit potentiellement la collecte chez les visiteurs équipés d’un bloqueur.
- **Région :** une région Vercel plus proche des visiteurs mais éloignée de PostgreSQL peut empirer la situation ; aligner d’abord Compute et base.
- **Build DB :** ne pas lancer `pnpm build` contre une base sensible pour simplement mesurer le frontend tant que migrations et seed y sont inclus.

## Définition de terminé

Le chantier sera considéré terminé lorsque :

- [ ] toutes les routes anonymes ciblées sont statiques dans le manifeste de production ;
- [ ] la matrice d’invalidation est couverte par des tests ;
- [ ] aucun seed ne s’exécute lors d’un build standard ;
- [ ] les parcours authentifiés, admin et Stripe ont passé les tests de non-régression ;
- [ ] les budgets de pré-rendu, JavaScript et images sont bloquants en CI ;
- [ ] les métriques Vercel à 7 jours confirment la baisse sans hausse d’erreurs ;
- [ ] les métriques à 30 jours atteignent ou approchent les cibles ci-dessus ;
- [ ] ce document est mis à jour avec les valeurs finales et les écarts expliqués.
