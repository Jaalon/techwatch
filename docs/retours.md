# Retours sur l’état actuel – Application de Veille Techno (MVT)

## 🎯 Objectif général

Document listant les retours généraux de l’utilisateur. Sera utilisé pour créer un nouveau plan de développement.

---

## plugin browser


## IA

* Configuration LLM : ajouter la possibilité de supprimer un modèle, bouton de suppression (croix même style que la croix close de la modale, mais avec la croix en rouge). Ce style d’élément doit être entré comme un style CSS commun.
* Modifier la configuration LLM : double cliquer pour ouvrir la modal de modification (la même que celui de création du LLM, mais avec les paramètres déjà renseignés). Possibilité de modifier le nom, la clé et l’API
* Ajouter la possibilité d’invalider un résumé IA : bouton aligné à droite du label "Invalider" avec le texte en rouge, avec le même style que Read ou Add to next TechWatch

## Packaging prod

* Générer un exécutable qui embarque la partie front

## Workflow

* Revoir le workflow de collecte de liens, ajout à mvt, publication mvt

## Fonctionnalités

* Tri par articles qui se sont pas dans une mvt

## Bugs

* Certaines catégories ne semblent pas être fixe. Peut être lorsqu’un article est ajouté à une mvt, à fouiller (ex: Article 1 qui oscille entre DevSecOps et IA)
* Problème du bouton "Add to next TechWatch" qui n’est pas désactivé si la mvt est déjà présente

# Pour plus tard

## IA configuration

* Séparer la gestion des clés de la gestion des modèles histoire d’éviter d’avoir à ajouter à chaque fois la clé à utiliser.

## IA

* Prompt directives -> champ texte plus grand
* Base de données des ressources (RAG)

## Base de données des liens

* Filtres avancés
* Recherche sémantique (avec un LLM)
* Gestion simplifiée des sources
  * Ajout/édition de flux RSS, blogs, chaînes, etc.
  * Option “Ignorer temporairement” 
* Purge manuelle des liens rejetés 
* Import de liens depuis Confluence/Notion

## Architecture

* Synchronisation entre 2 nœuds TechWatch (ordi perso <-> ordi boulot)

## UI
* Avoir la possibilité de modifier le nombre d’article max, supprimer les boutons du haut, supprimer le Show articles, supprimer le "Articles grouped by category", avoir la possibilité de bouger un article à la prochaine mvt
* TechWatchs: pas d’id, avoir une liste paginée/réduite de mvt, possibilité de cacher/afficher les mvt completed, tri par date, …
    * possibilité de remettre une mvt en planifiée
    * possibilité de changer la date de mvt
    * Titre de la mvt ouverte : juste le nom et son status
    * la vue d’une mvt ouverte doit être la même que proposée pour Next
    * Show markdown doit être un modal

* Settings:
    * revoir la présentation des llms, afficher juste le nom
