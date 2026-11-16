# Cache et fraîcheur des données

Le site conserve `cacheComponents` et le cache partagé des lectures. Les écritures expirent leurs dépendances après validation de la transaction. Il n’y a pas de polling réseau.

| Profil | stale | revalidate | expire | Lectures |
| --- | ---: | ---: | ---: | --- |
| operational | 0 s | 30 s | 300 s | Tournoi, équipes, inscriptions, espace joueur et administration |
| catalog | 30 s | 60 s | 300 s | Catalogues, annuaire, statistiques publiques et données du hero |
| activity | 0 s | 15 s | 60 s | Visites récentes |
| editorial | 300 s | 1 h | 1 jour | Paramètres, sponsors publics et sitemap |

`stale` concerne le routeur client, pas la fraîcheur de la base. Les durées sont un filet de sécurité, pas un remplacement de l’invalidation.

## Écritures

- Utiliser `expireActionTags` dans une Server Action et `expireRequestTags` dans une route API ou un hook Better Auth exécuté pendant une requête. Le second utilise `revalidateTag(tag, { expire: 0 })`.
- Utiliser les groupes `invalidateTournamentParticipation`, `invalidateTournamentCatalog` et `invalidatePlayer`, puis attendre la collecte de leurs dépendances.
- Capturer les joueurs concernés avant une suppression en cascade. Les espaces personnels des autres membres et les historiques des anciens inscrits font aussi partie des dépendances.
- Invalider une inscription payante avant de retourner le checkout et après tout nettoyage d’échec. Les équipes en attente de paiement sont déjà proposées aux coéquipiers.
- Les webhooks collectent leurs impacts pendant le traitement puis les expirent hors de la gestion des reprises financières. Une panne du cache ne doit pas rejouer une opération déjà validée.
- Ne pas modifier la base ni invalider le cache pendant un rendu React. Le profil nettoie les inscriptions expirées par une action authentifiée à son entrée.
- Une erreur de lecture doit être propagée, plutôt que transformée en zéro, liste vide ou fausse absence mise en cache.

Les catalogues et agrégats utilisent des tags de collection. Les détails utilisent des tags par tournoi et par joueur. Les profils privés restent indexés par l’identifiant utilisateur fourni par la session. Session, bannissement et état personnel d’inscription ne sont pas mis dans le cache partagé.

## Navigation

La barrière commune recontrôle les routes modifiables à la navigation et lors des restaurations de l’historique. Elle regroupe les événements, préserve l’état React et ne se déclenche pas à nouveau après son propre `router.refresh()`.

Une page laissée ouverte n’est pas actualisée périodiquement. Les calculs liés à l’heure s’effectuent hors des résultats mis en cache. Les images à URL immuable conservent leur cache long.

## Vérification

La CI génère les types Next.js des profils de cache et construit avec un PostgreSQL isolé, migré avec les migrations existantes. Les limites d’erreur des lectures ne servent plus à masquer une base absente pendant le build.

- Contrôles : génération Prisma, `next typegen`, TypeScript, Biome, Knip et `pnpm test:coverage`.
- Build sans migration implicite : `pnpm exec next build --webpack`, puis `pnpm verify:build`.
- Écoute Stripe en mode test : `pnpm stripe:listen`. Pour un port isolé : `pnpm stripe:listen --forward-to localhost:3300/api/webhook`. Le script inscrit le secret du listener dans son `.env.local` ; démarrer le serveur de production après le listener.
- Intégration : `pnpm test:cache-runtime /chemin/du/site-construit`. Fournir `DATABASE_URL`, `BETTER_AUTH_SECRET`, `STRIPE_WEBHOOK_SECRET` et, si nécessaire, `CACHE_TEST_ORIGIN`. Le serveur doit utiliser les mêmes valeurs. Le script exige une application locale et une base locale dont le nom contient `cache_test`.

Le test d’intégration réchauffe les caches, utilise deux sessions joueur et une session admin, crée des checkouts de test, vérifie les disponibilités, le renommage, les expirations, l’identité et l’archivage. Les webhooks signés envoyés par ce test sont des fixtures locales ; ils ne prouvent pas la livraison d’un paiement par Stripe.
