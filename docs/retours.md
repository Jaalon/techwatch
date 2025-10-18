# Retours sur l’état actuel – Application de Veille Techno (MVT)

## 🎯 Objectif général

Document listant les retours généraux de l’utilisateur. Sera utilisé pour créer un nouveau plan de développement.

---

## UI

* Liens
  * La liste des liens doit être revue : la description et les tags doivent apparaître. Possibilité d’ajouter un tag dans le champ à côté (pas de bouton add, juste appuyer sur Entrée ajoute le tag). Le bouton de suppression d’un tag doit être revu pour être moins encombrant. Idem pour le style des tags. Les boutons pour la gestion du cycle de vie doivent être revus 
  * Édition de liens : le résumé IA doit pouvoir se scroller, le résumé IA est caché s’il n’y en a pas et remplacé par un bouton "IA summarize"
* Next: 
  * Avoir la possibilité de modifier le nombre d’article max, supprimer les boutons du haut, supprimer le Show articles, supprimer le "Articles grouped by category", avoir la possibilité de bouger un article à la prochaine mvt
* TechWatchs: pas d’id, avoir une liste paginée/réduite de mvt, possibilité de cacher/afficher les mvt completed, tri par date, …
  * possibilité de remettre une mvt en planifiée
  * possibilité de changer la date de mvt
  * Titre de la mvt ouverte : juste le nom et son status
  * la vue d’une mvt ouverte doit être la même que proposée pour Next
  * Show markdown doit être un modal
* Settings:
  * revoir la présentation des llms, afficher juste le nom
* Export Markdown -> popup avec téléchargement possible, ne pas afficher la date
* TechWatchComponent -> affiche la date de la mvt, possibilité de modifier un lien (popup), possibilité de modifier le nombre maximal de liens)
* Add LLM -> popup
* Prompt directives -> champ texte plus grand
* Merger LinkListComponent et LinkList

## Architecture

* Revoir la structure de la UI afin d’avoir des "boîtes" cohérentes et plus faciles à comprendre/styliser.

## Résumé LLM

* Configuration LLM : ajouter la possibilité de supprimer un modèle, bouton de suppression (croix même style que la croix close de la modale, mais avec la croix en rouge). Ce style d’élément doit être entré comme un style CSS commun.
* Ajouter la possibilité d’invalider un résumé IA
* Résumer un article depuis le lien ou depuis le contenu sauvegardé

## plugin browser

* Lancer le résumé IA depuis le plugin browser
* Extraire le contenu d’un article depuis le plugin au cas où l’IA n’arrive pas à y accéder
* Si le lien existe déjà en base de données, récupérer les infos depuis l’API backend et ajouter des interactions possibles depuis le plugin browser

## Fonctionnalités

* Tri par articles qui se sont pas dans une mvt

## Bugs

* Certaines catégories ne semblent pas être fixe. Peut être lorsqu’un article est ajouté à une mvt, à fouiller (ex: Article 1 qui oscille entre DevSecOps et IA)
* Problème du bouton "Add to next TechWatch" qui n’est pas désactivé si la mvt est déjà présente

# Pour plus tard

## IA configuration

* Séparer la gestion des clés de la gestion des modèles histoire d’éviter d’avoir à ajouter à chaque fois la clé à utiliser.