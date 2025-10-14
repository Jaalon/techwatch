# 🗺️ Plan de Développement – Application de Veille Techno (MVT)

## 🎯 Objectif général
Créer une application locale permettant de couvrir rapidement l’ensemble du workflow de la Minute Veille Techno (MVT), avec des livraisons incrémentales.  
Chaque tâche apporte une **fonctionnalité immédiatement utilisable** dans le flux réel de veille, afin d’obtenir de la valeur dès les premières étapes.

---

# 🚀 Plan de développement orienté “workflow utilisable”

## **Itération 1 – Collecte manuelle et gestion locale des liens**
🎯 *Objectif : centraliser et classer les liens à la main pour amorcer le cycle de veille sans automatisation.*

### Fonctionnalités livrées
- [x] Initialisation du projet (backend + frontend + base locale)
  - Setup backend (API REST + base SQLite fichier pour données opérationnelles; H2 réservé aux tests)
  - Setup frontend minimal (UI locale)
  - Modèle `Lien` (id, titre, URL, description, statut, date)
  - Endpoint `/links` (CRUD complet)
- [x] Interface de collecte manuelle
  - Formulaire “Ajouter un lien” (titre, URL, description)
  - Liste des liens avec statut “À traiter”
  - Actions : Garder / Plus tard / Rejeter / Supprimer
  - Persistance locale
- [ ] Vue “À considérer”
  - Liste paginée triée par date
  - Barre de recherche simple
  - Tri ou filtrage minimal (par statut)

💡 *Résultat : tu peux déjà centraliser et trier tes liens de veille directement dans l’application.*

---

## **Itération 2 – Première MVT et export**
🎯 *Objectif : regrouper les liens par catégories et générer un premier export prêt à copier dans Confluence.*

### Fonctionnalités livrées
- [ ] Création et gestion d’une MVT
  - Entité `MVT` (id, titre, date, statut)
  - Une seule MVT active à la fois
  - Ajout de liens à la MVT active via le statut “Prochaine MVT”
- [ ] Organisation en catégories
  - Création libre de catégories
  - Association manuelle de liens à des catégories
- [ ] Export texte brut
  - Génération du texte au format :
    ```
    MVT — 2025-10-13
    CATEGORIE 1
    - TITRE (URL) : DESCRIPTION
    ```
  - Bouton “Copier texte” ou “Télécharger .txt”

💡 *Résultat : tu peux préparer et exporter ta première MVT complète sans quitter l’app.*

---

## **Itération 3 – Extension navigateur & API locale**
🎯 *Objectif : accélérer la collecte sans copier-coller manuel.*

### Fonctionnalités livrées
- [ ] API REST locale stable
  - Endpoint `POST /api/links` pour ajout externe
  - Vérification doublons (URL déjà rejetée ou existante)
- [ ] Extension navigateur minimaliste
  - Bouton “Ajouter à la MVT”
  - Extraction du titre et URL de la page courante
  - Fenêtre optionnelle pour description
  - Envoi à l’API locale (port configurable)
- [ ] Tri et affichage enrichi
  - Tri : nouveaux liens (extension) en tête de liste
  - Option “Ignorer cette source jusqu’au rechargement”

💡 *Résultat : tu peux ajouter des liens instantanément depuis ton navigateur et les voir apparaître dans ta liste.*

---

## **Itération 4 – Résumé LLM et fin de cycle automatique**
🎯 *Objectif : accélérer la lecture et la préparation de la MVT avec IA + cycle complet automatisé.*

### Fonctionnalités livrées
- [ ] Intégration LLM (local ou API)
  - Configuration UI (mode LOCAL/API, endpoint, modèle, clé)
  - Bouton “Résumer” sur chaque lien
  - Résumé stocké dans la base et affiché sous le lien
- [ ] Gestion complète du cycle MVT
  - Bouton “Terminer la MVT”
  - Auto-création d’une nouvelle MVT :
    - si la précédente est terminée
    - ou si elle contient 10 liens
  - Transfert automatique des “gardés pour prochaine”
- [ ] Registre des rejets
  - Liste des URLs rejetées
  - Blocage automatique des réimportations

💡 *Résultat : tu peux faire tout le processus complet de veille jusqu’à la publication d’une MVT synthétisée.*

---

## **Itération 5 – Recherche, tri avancé et confort d’usage**
🎯 *Objectif : fluidifier l’usage quotidien et fiabiliser la consultation.*

### Fonctionnalités livrées
- [ ] Recherche étendue
  - Recherche classique (titre, description, source, catégorie, tags)
  - Option “Recherche sémantique” activable (LLM)
- [ ] Tri et filtres avancés
  - Tri : date, source, statut
  - Filtres rapides (à traiter / prochaine / rejetés)
- [ ] Historique complet des MVT
  - Liste des MVT passées avec possibilité d’ouvrir/exporter
  - Vue synthétique (nombre de liens, catégories, date)
- [ ] Gestion simplifiée des sources
  - Ajout/édition de flux RSS, blogs, chaînes, etc.
  - Option “Ignorer temporairement”

💡 *Résultat : tu disposes d’un outil fluide et complet, de la collecte à la restitution.*

---

# 🪜 Synthèse des livrables

| Itération | Focus principal | Fonction clé livrable | Valeur utilisateur |
|------------|----------------|------------------------|--------------------|
| **1** | Collecte manuelle | CRUD liens + UI liste | Centralisation rapide |
| **2** | Rédaction | MVT + export texte | Préparation de MVT complète |
| **3** | Collecte rapide | Extension navigateur | Ajout instantané de liens |
| **4** | Synthèse & cycle | Résumé LLM + auto-MVT | Préparation automatisée |
| **5** | Confort & recherche | Historique + tri + filtres | Fluidité d’usage quotidienne |

---

# 🔮 Étapes suivantes (V1.1+)
- [ ] Purge manuelle des liens rejetés
- [ ] Résumés en batch
- [ ] Import depuis Confluence/Notion
- [ ] Recherche sémantique locale optimisée
- [ ] Synchronisation réseau (multi-postes)
- [ ] Alertes automatiques sur nouvelles sources

---

📘 *Ce plan suit une approche itérative pragmatique : chaque livraison apporte un fragment complet du workflow de veille, utilisable immédiatement.*

---

# 🧪 Décisions techniques – Persistance & Recherche sémantique

- Base opérationnelle (liens, MVT, résumés, rejets, config) : SQLite en fichier local.
  - Raison : stabilité, portabilité, durabilité fichier, tooling mature. H2 reste utile pour les tests en mémoire.
- Vector store pour recherche sémantique/RAG : ChromaDB en mode embedded service.
  - Hébergé localement (process/service) avec stockage sur disque, collections dédiées.
  - Intégration côté backend via client HTTP; génération d’embeddings côté backend.
- Pipeline embeddings (préparation V1.2, activable en V1.0 pour POC) :
  - Lors d’un résumé LLM, stocker le texte dans SQLite et indexer (embeddings) dans Chroma.
  - Stocker l’ID du document/embedding renvoyé par Chroma dans SQLite pour traçabilité.

## Impacts sur les itérations
- Itération 1
  - Choix SQLite pour la persistance par défaut (H2 pour tests).
- Itération 4
  - « Résumé stocké » = persistance dans SQLite. Hook d’indexation Chroma optionnel.
- Itération 5
  - Activer la « Recherche sémantique » en s’appuyant sur ChromaDB embedded.
  - Ajouter pipeline embeddings (création/mise à jour/suppression synchronisées).

