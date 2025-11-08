# Retours sur l’état actuel – Application de Veille Techno (MVT)

## 🎯 Objectif général

Document listant les retours généraux de l’utilisateur. Sera utilisé pour créer un nouveau plan de développement.

---

## Déploiement

## Link list

## Techwatch

## Workflow

* Revoir le workflow de collecte de liens, ajout à mvt, publication mvt
  * REJECTED : On garde pas le lien
  * KEEP : Lien à garder
  * TO_HANDLE: Lien à traiter

## Fonctionnalités

* Importer les techwatch depuis une page wiki (confluence)
* Importer les techwatch depuis une page Notion
* Importer/Exporter la base de données

## IA configuration

* Séparer la gestion des clés de la gestion des modèles histoire d’éviter d’avoir à ajouter à chaque fois la clé à utiliser.

## IA

* Prompt directives -> champ texte plus grand
* Base de données des ressources (RAG)

## Base de données

* Filtres avancés
* Recherche sémantique (avec un LLM)
* Gestion simplifiée des sources
  * Ajout/édition de flux RSS, blogs, chaînes, etc.
  * Option “Ignorer temporairement” 
* Purge manuelle des liens rejetés 
* Import de liens depuis Confluence/Notion
* Backup/Restore

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

## Déploiement

* Avoir la possibilité d’installer l’extension navigateur depuis le frontend

## Bugs

* Certaines catégories ne semblent pas être fixe. Peut-être lorsqu’un article est ajouté à une mvt, à fouiller (ex: Article 1 qui oscille entre DevSecOps et IA)

## Environnement de dev

* quarkus dev devrait lancer le backend d’un côté et le frontend de l’autre. techwatch.properties ne devrait être créé que pour le mode prod (pas le mode dev).