# Refonte UX/UI — suivi de réalisation

L’identité sombre, les couleurs bleu–indigo–violet, les accents dorés et Paladins sont conservés. Les changements réutilisent les actions, permissions, règles de paiement et contenus existants. Aucune migration de données n’est ajoutée.

## Réalisation de la roadmap

| Points | Réalisation |
| --- | --- |
| 1–2 — Inscription et débordements | Formulaire sorti de la colonne sticky, boutons adaptatifs, récompenses rendues une seule fois, conteneurs réductibles et normalisation des espaces insécables au rendu. Le HTML stocké est conservé. |
| 3–4 — Attentes | Liens avec indicateur de navigation, lignes de tableau avec retour local, skeletons distincts pour listes, détails et formulaires. Le cadre admin reste affiché pendant les transitions. |
| 5–8 — Composants communs | Surfaces et espacements partagés, actions principales aux couleurs de marque, champs et cibles tactiles agrandis, focus visible, fenêtres limitées à la hauteur disponible et contenu défilable. |
| 9–11 — Fiche tournoi | Résumé simplifié, prix par joueur, navigation par sections, inscription large dans le flux principal, liens directs et raccourci mobile masqué au formulaire, au clavier et au pied de page. |
| 12–14 — Inscription et paiement | Choix d’équipe puis réponses, don et récapitulatif individuel, erreurs durables, vérification avec nouvelle tentative, états complet et rejoindre uniquement. Un retour Stripe ne confirme plus à lui seul une inscription ni la libération d’une place. |
| 15–16 — Accueil et catalogue | Hero raccourci, tournois rapprochés du début de page, statut séparé du titre dans les cartes, grilles adaptées aux petites listes, filtres locaux synchronisés à l’URL, pagination bornée et nombre de résultats annoncé. |
| 17–18 — Joueur et espace public | Inscriptions et tournois actifs avant les paramètres personnels, historique accessible par son lien direct, reprise d’une inscription en attente, retours persistants du profil et du contact. Navigation mobile et pages secondaires utilisent les composants communs. Le stream distingue connexion, direct, hors ligne, absence de configuration et lecteur indisponible. |
| 19–20 — Cadre admin et dashboard | Menu développé sur grand écran et réductible avec préférence conservée, titres longs et actions séparés, accès direct à la création de tournoi. Synthèse, revenus et activité chargent indépendamment. |
| 21–22 — Gestion | Recherche, filtre, tri et pagination conservés dans l’URL des listes. Liens natifs pour les fiches, tri accessible au clavier, informations essentielles visibles sur mobile, onglets admin avec libellés et retour d’attente. Les lectures indépendantes de participants sont parallélisées. |
| 23–24 — Édition et médias | Sommaire de sections, erreurs repérables, accès à la section invalide, barre d’enregistrement accessible et protection des modifications sur les liens et à la fermeture. Progression des imports, erreurs par fichier et conservation des imports réussis. Commandes de médias visibles au tactile et au focus clavier. |
| 25–26 — Accessibilité et fluidité | Libellés et erreurs associés aux champs, états annoncés, focus et réduction des animations, ancres respectées et absence de défilement animé obligatoire. Attentes de lecture découpées avec Suspense et requêtes indépendantes exécutées en parallèle. |
| 27 — Validation et livraison | Recette locale avec compte, tournois et contenus longs, tests Vitest, typage, Biome, Knip et build de production. Déploiement et collecte des retours réels restent à réaliser après revue. |

## Vérifications locales

- Liste admin filtrée, ouverture d’un tournoi et indicateur d’attente observés dans le navigateur.
- Édition et enregistrement d’un tournoi de recette effectués dans la base locale.
- Inscription gratuite effectuée avec huit réponses, dont une réponse numérique ; confirmation affichée et nombre d’inscrits actualisé.
- Historique du profil ouvert depuis `#tournaments-history` avec sélection du bon onglet.
- Récompenses longues vérifiées à 320 px : un seul bloc, texte complet, largeur de contenu égale à la largeur disponible et aucun débordement de la page.
- Formulaires et navigation examinés sur ordinateur et mobile. Les données de recette sont exclusivement locales.

## Tests et contrôles

- Les tests Vitest couvrent notamment les URL de listes, liens du profil, capacités solo/équipe, retours de paiement, erreurs de lecture, imports partiellement échoués et normalisation de l’éditeur.
- Aucun test e2e, aucune dépendance Playwright et aucun job CI supplémentaire ne sont ajoutés.
- Commandes de validation : `pnpm exec tsc --noEmit`, `pnpm exec biome check .`, `pnpm exec knip`, `pnpm test:coverage`, `pnpm build`.
- Le build conserve le rendu statique des pages publiques et les budgets existants de JavaScript et d’images.
- Résultat de validation : 1 109 tests passants, typage/Biome/Knip sans erreur, build de production réussi et neuf routes publiques statiques. Aucun changement des workflows CI ni des dépendances du projet.

## Recette à poursuivre avant publication

- Vérifier le vrai cycle Stripe en mode test : confirmation différée, annulation, expiration et nouvelle tentative. Aucun paiement réel n’a été effectué pour cette refonte.
- Vérifier les imports contre un stockage de prévisualisation et les intégrations Twitch/Toornament avec leurs données réelles.
- Compléter la recette clavier, lecteur d’écran, zoom et réseau ralenti sur les navigateurs ciblés. Le refus de quitter via l’historique dépend de la possibilité d’annuler la navigation dans le navigateur ; liens et fermeture disposent de leur propre protection.
- Mesurer les transitions sur un déploiement de prévisualisation : les mesures du serveur de développement ne représentent pas la latence en production.
- Faire relire les parcours par l’organisateur et des joueurs, puis déployer et contrôler la production.

## Corrections après recette en préproduction

- L’accueil sélectionne les tournois non terminés avant de limiter les cartes à trois. Le catalogue présente les événements en cours et à venir par date croissante, puis les événements terminés, sans les masquer.
- Les sélections de tournois se rafraîchissent périodiquement (revalidation serveur après une minute, cache de navigation de 30 secondes), en complément de l’invalidation immédiate à la publication. Le contrôle du build autorise ce délai sur l’accueil et le catalogue tout en conservant leur rendu statique et les budgets d’assets.
- Un ancien retour Stripe ne bloque plus le formulaire après désinscription : seule une inscription réellement en attente bloque une nouvelle soumission. Le message suit la lecture serveur, sans annoncer une confirmation depuis l’URL. Les dossiers de paiement annulés restent conservés en base.
- La vérification de l’inscription est relancée au retour dans l’onglet et après restauration de page. Le double bandeau de paiement a été supprimé.
- Les champs personnalisés occupent toute la largeur du formulaire. Les liens conservent leur loader sans imposer de curseur d’attente. La commande de réduction du menu admin se situe en bas de la sidebar.
- Recette locale : inscription payante annulée conservée en base avec ancienne URL Stripe, largeur complète des champs, commande du menu à 8 px du bas, tournoi imminent en premier et tournoi terminé exclu de l’accueil.
- Validation : 1 117 tests unitaires passants, typage/Biome/Knip et build réussis, neuf routes publiques statiques. Aucun test e2e, changement de dépendance ou nouveau job CI.
