# Retours sur l’état actuel – Application de Veille Techno (MVT)

## 🎯 Objectif général

Document listant les retours généraux de l’utilisateur. Sera utilisé pour créer un nouveau plan de développement.

---

# Next

* Ajout d’une clé perplexity : erreur à la sauvegarde...
* Mettre une Techwatch en active, ajouter un article, la remettre en planned et metter une autre
* La catégorie des liens dans une techwatch semble changer lorsque la catégorie par défaut n’a pas été fixée manuellement
* Pagination des links

# Backlog

## Bug

## Fonctionnalités

* Importer les techwatch depuis une page Notion
* Importer les techwatch depuis une page wiki (confluence)


## Links

* Ajouter un bouton pour voir les techwatch auxquelles un lien a été ajouté

## Architecture

* Synchronisation entre 2 nœuds TechWatch (ordi perso <-> ordi boulot)

## Techwatch

* Une techwatch peut voir la description s’un link surchargé pour juste cette techwatch
* Réorganiser l’ordre des catégories par drag&drop

## Settings

* Prompt directives -> champ texte plus grand

## Workflow

* Revoir le workflow de collecte de liens, ajout à mvt, publication mvt
  * REJECTED : On garde pas le lien
  * KEEP : Lien à garder
  * TO_HANDLE: Lien à traiter

## IA

* Base de données des ressources (RAG)

## Base de données

* Filtres avancés
* Recherche sémantique (avec un LLM)
* Gestion simplifiée des sources
  * Ajout/édition de flux RSS, blogs, chaînes, etc.
  * Option “Ignorer temporairement” 

## Environnement de dev

* gradle dev devrait lancer le backend d’un côté et le frontend de l’autre. techwatch.properties ne devrait être créé que pour le mode prod (pas le mode dev).