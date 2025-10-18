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


## Architecture

* Revoir la structure de la UI afin d’avoir des "boîtes" cohérentes et plus faciles à comprendre/styliser.

### Front

À voir:
* Gestion des popups
* Popup pour ajouter un lien
* Popup d’édition d’un lien
* Export Markdown -> popup avec téléchargement possible, ne pas afficher la date
* TechWatchComponent -> affiche la date de la mvt, possibilité de modifier un lien (popup), possibilité de modifier le nombre maximal de liens)
* Add LLM -> popup
* Prompt directives -> champ texte plus grand
* Merger LinkListComponent et LinkList

## Résumé LLM

* Le LLM (perplexity) ne semble pas arriver à accéder aux articles, il faudrait rapatrier le contenu pour le résumé. 

## Workflow d’utilisation

## Fonctionnalités

* Tri par articles qui se sont pas dans une mvt

## Build

## Bugs

* Certaines catégories ne semblent pas être fixe. Peut être lorsqu’un article est ajouté à une mvt, à fouiller (ex: Article 1 qui oscille entre DevSecOps et IA)
* Problème du bouton "Add to next TechWatch" qui n’est pas désactivé si la mvt est déjà présente