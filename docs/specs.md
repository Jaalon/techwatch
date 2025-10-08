# 📘 Spécifications Fonctionnelles – Application de Veille Techno (MVT)

## 🎯 Vision & Objectifs
- **Automatiser** la collecte multi-sources pour la Minute Veille Techno (MVT).
- **Centraliser** les liens, statuts et décisions (garder/rejeter/plus tard/prochaine MVT).
- **Accélérer** la préparation via **résumés LLM** (modèle local ou API externe).
- **Restituer** en texte brut **avec mise en forme et liens cliquables**, prêt à coller dans Confluence.
- **Préserver le contrôle humain** sur la catégorisation et la sélection finale.

---

## 🧱 Périmètre Fonctionnel V1

### 1. Collecte
- Ajout via **extension navigateur** (titre, URL, description optionnelle) → envoi à l’API locale.
- Ingestion depuis **sources enregistrées** (RSS, YouTube, blogs, HN, Reddit, X, Medium…).
- **Ignorer temporairement** une source (jusqu’au rechargement).
- Liste d’**éléments à considérer** : les ajouts depuis l’extension apparaissent en premier.
- Statuts possibles :
  - 🔹 À traiter
  - 🟢 Garder pour la prochaine MVT
  - 🟡 Garder pour plus tard
  - 🔴 Rejeté (trace conservée pour éviter la réimportation)

---

### 2. Analyse / Synthèse
- **Résumé à la demande** via LLM (local ou API configurée).
- Suggestions automatiques (optionnelles) de **catégorie** et **tags**.
- L’utilisateur garde le contrôle sur la classification et l’affectation.

---

### 3. Gestion des MVT
- MVT = ensemble de **catégories dynamiques** + liste de **liens (titre + URL + description)**.
- **Création automatique** d’une nouvelle MVT lorsque :
  - la précédente est **terminée**, ou
  - elle contient **10 liens**.
- **Date par défaut** : lundi suivant la dernière MVT (modifiable).
- À la terminaison d’une MVT :
  - Les liens “gardés pour la prochaine” sont transférés vers la nouvelle.
- Historique complet des MVT passées et planification des futures.

---

### 4. Recherche
- Recherche **classique** (titre, description, source, catégorie, tags).
- Recherche **sémantique** (LLM ou embeddings locaux, optionnelle).

---

### 5. Export
- Export au format **texte brut structuré**, compatible avec Confluence :
  ```
  MVT — 2025-10-13
  CATEGORIE 1
  - TITRE (URL) : DESCRIPTION
  - TITRE (URL) : DESCRIPTION

  CATEGORIE 2
  - TITRE (URL) : DESCRIPTION
  ```
- Liens cliquables et mise en page conservée au copier-coller.

---

## ✅ User Stories (MoSCoW)

### Must Have
- Ajouter un lien via l’extension navigateur.
- Ajouter/éditer un lien manuellement.
- Modifier le statut d’un lien : À traiter / Prochaine / Plus tard / Rejeté.
- Créer / terminer une MVT (auto-création si terminée ou 10 liens atteints).
- Date par défaut de la nouvelle MVT = lundi suivant.
- Organiser les liens en **catégories créées à la volée**.
- Générer un **résumé LLM** à la demande.
- **Copier/exporter** la MVT en texte brut formaté.
- Empêcher la réimportation des liens rejetés.
- Recherche **classique** (texte complet).

### Should Have
- Ignorer temporairement une source.
- Suggestions IA (catégories, tags).
- Recherche sémantique optionnelle.

### Could Have
- Tri (source/date/statut).
- Tags libres.
- Résumés en batch.

### Won’t Have (V1)
- Import depuis Confluence/Notion.
- Purge automatique.
- Collaboration multi-utilisateurs / mode réseau.

---

## 🔄 Workflows Clés

### A. Collecte → Sélection
1. L’extension envoie (titre, URL, description) → API locale.
2. Lien ajouté dans la liste “À considérer”.
3. L’utilisateur peut ignorer temporairement une source.
4. Pour chaque lien :
   - Option “Résumé” (LLM)
   - Suggestions IA (catégories/tags)
   - Actions : Garder / Rejeter / Plus tard
5. “Garder pour prochaine MVT” → ajoute le lien à la MVT active.
6. “Rejeté” → trace enregistrée (non réimportable).

---

### B. Cycle de MVT
1. MVT active = en cours de préparation.
2. L’utilisateur catégorise les liens retenus.
3. Lorsqu’elle est prête → **Terminer MVT**.
4. Auto-création d’une nouvelle MVT si :
   - la précédente est terminée, ou
   - elle atteint 10 liens.
5. Date préremplie = lundi suivant (modifiable).
6. Transfert automatique des liens marqués “Prochaine”.

---

### C. Export
- Un clic “**Copier en texte**” génère :
  ```
  MVT — 2025-10-13
  CATEGORIE 1
  - TITRE (URL) : DESCRIPTION
  ...
  ```

---

## 🧠 Modèle Métier (Entités & Champs)
*(Section simplifiée pour lisibilité)*

- **Source** : id, nom, type, url, actif, dernièreVérif
- **Lien** : id, titre, url, descriptionCourte, sourceId, dateDécouverte, statut, rejetRaison, mvtId, catégories[], tags[]
- **Résumé** : id, lienId, texte, dateGénération, modèle, promptTemplateId, paramètres, langue, hashContenu, chromaId
- **Catégorie** : id, nom, description
- **MVT** : id, titre, date, statut, liens[], catégories[]
- **Tag** : id, nom
- **Config LLM** : mode, endpoint, clé, modèle, paramètres, promptTemplates[]
- **RegistreRejets** : url, dateRejet, raison

---

## 📏 Règles Métier
- Nouvelle MVT créée si précédente terminée ou 10 liens atteints.
- Date par défaut = lundi suivant.
- Transfert auto des liens “Prochaine”.
- Liens rejetés non réimportables.
- Catégories libres.
- L’extension ne stocke que host:port.

---

## 🖥️ UI – V1 Minimaliste
1. Barre de navigation : MVT active | Historique | Recherche | Sources | Config
2. Liste “À considérer” : liens récents, actions inline.
3. MVT active : titre, date, compteur, catégories dynamiques.
4. Recherche : classique / sémantique.
5. Config : LLM, extension, sources.

---

## 🧩 Extension Navigateur
- Bouton “Ajouter à la MVT”.
- Collecte : titre, URL, description.
- Envoi à `POST /api/links`.
- Stocke uniquement host:port.
- Message succès/échec.

---

## 🤖 Intégration LLM
- Mode : LOCAL ou API.
- Endpoint, modèle, clé.
- Prompt template configurable.
- Résumé sauvegardé (texte, date, modèle).

---

## 🧱 Persistance & Stockage (décision)
- Données opérationnelles (SQL) : SQLite (fichier local) pour liens, MVT, résumés, rejets, config.
  - Justification vs H2 : SQLite est file-based, robuste et cross-plateforme pour du local-first persistant; H2 est idéal pour tests/mémoire mais moins approprié comme store durable utilisateur.
  - Alternatives envisagées :
    - PostgreSQL: puissant mais surdimensionné pour poste local single-user.
    - DuckDB: analytique/colonnes, moins adapté au CRUD transactionnel.
- Recherche sémantique (vecteurs) : ChromaDB en service embedded.
  - Démarrage local (process/service) avec persistance disque.
  - Collections proposées :
    - links_texts (contenus bruts optionnels)
    - summaries (résumés LLM)
    - articles (si extraction d’articles complète ultérieure)
  - Stockage de l’ID/clé Chroma côté SQLite pour lien fort entre données SQL et index.
  - Re-indexation sur modification/suppression (webhooks internes ou hooks applicatifs).
- RAG (plus tard) : requête sémantique → ids → fetch SQL → composition de réponse.

## 🛡️ Non-Fonctionnel
- Local-first.
- Fluide jusqu’à 5000 liens.
- Fonctionne sans LLM.
- Clés chiffrées localement.
- Journalisation minimale.

---

## 🗺️ Roadmap
### V1.0
Collecte, MVT auto, LLM résumé, recherche classique.
### V1.1
Tri, tags, purge manuelle, batch résumé.
### V1.2
Import Notion/Confluence, recherche sémantique, exports personnalisés.
### V2+
Mode réseau, sync, multi-utilisateurs.

---

## 🔍 Critères d’Acceptation
- Fin de MVT crée automatiquement la suivante (date lundi).
- 10 liens atteints → création auto suivante.
- Transfert des liens “Prochaine” vers la nouvelle.
- Export texte prêt à coller dans Confluence.
- Un résumé LLM déclenché est persisté dans la base locale (SQLite) et référencé pour indexation sémantique (chromaId présent ou indexation différée marquée).
- Liens rejetés non réimportés.

---
