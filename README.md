# NFE212 — Introduction à la Modélisation Prédictive

> Cours interactif en ligne · CNAM EPN05 · Laboratoire CEDRIC
> **Auteur :** NDAO Mouhamadou Lamine — mlndao@outlook.com

Site pédagogique single-page couvrant les fondements de la modélisation prédictive supervisée et non supervisée, avec des **animations interactives** construites entièrement en HTML/CSS/JavaScript natif (sans framework).

---

## Aperçu

Le cours est structuré en 7 sections, accessibles depuis une barre latérale à gauche avec navigation par sous-sections :

| # | Section | Contenu |
|---|---------|---------|
| 01 | Introduction | Science des données, terminologie, typologie des variables |
| 02 | Types de problèmes | Apprentissage supervisé, non supervisé, par renforcement |
| 03 | Analyse prédictive | Régression linéaire, classification logistique, qualité des données |
| 04 | Construction d'un modèle | Critères de choix, étapes, métriques (classification & régression) |
| 05 | Apprentissage & Validation | Partitionnement, validation croisée k-fold |
| 06 | Biais & Variance | Compromis biais-variance, régularisation, sur/sous-apprentissage |
| 07 | Références | Cours, ouvrages et outils de référence |

### Animations interactives (Canvas 2D)

- **Régression linéaire** — visualisation du nuage de points et de la droite ajustée
- **Descente de gradient 2D** — contour de la fonction de coût, trajectoire de l'optimisation en régression *et* en classification (heatmap de probabilité, frontière de décision, courbe de perte BCE)
- **Frontière de décision & complexité** — illustration du compromis biais-variance avec 5 niveaux de complexité (sous-apprentissage → sur-apprentissage), courbes d'erreur train/test
- **Validation croisée** — animation k-fold pas à pas

---

## Structure du projet

```
site_cours/
├── index.html              # Page principale (SPA)
├── assets/
│   ├── css/
│   │   └── style.css       # Styles (sidebar, layout, composants)
│   ├── js/
│   │   └── animations.js   # Toutes les animations Canvas 2D (~1500 lignes)
│   └── images/             # Illustrations du cours (PNG)
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD → GitHub Pages automatique
├── .gitignore
├── LICENSE                 # CC-BY 4.0
└── README.md
```

---

## Lancer en local

Aucune dépendance, aucune étape de build. Il suffit d'ouvrir le fichier :

```bash
# Option 1 — ouverture directe dans le navigateur
open index.html

# Option 2 — serveur local (recommandé pour éviter les restrictions CORS)
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

---

## Déploiement sur GitHub Pages

### Méthode automatique (recommandée)

Le workflow `.github/workflows/deploy.yml` déploie automatiquement à chaque push sur `main`.

**Étapes à effectuer une seule fois :**

1. Pousser le dépôt sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<utilisateur>/<depot>.git
   git push -u origin main
   ```

2. Dans les **Settings** du dépôt GitHub → onglet **Pages** :
   - Source : **GitHub Actions**

3. Le site sera accessible à l'adresse :
   ```
   https://<utilisateur>.github.io/<depot>/
   ```

### Méthode manuelle

Dans les Settings → Pages, choisir **Branch: main** / **Folder: / (root)** et sauvegarder.

---

## Technologies

- **HTML5** sémantique (aucun framework)
- **CSS3** — variables personnalisées, grid, flexbox, `position: fixed`
- **JavaScript ES6+** — Canvas 2D API, `IntersectionObserver`, animations `requestAnimationFrame`
- Fontes : [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Google Fonts)
- Icônes : aucune bibliothèque externe, symboles Unicode

---

## Références intégrées au cours

- R. Rakotomalala (Université Lyon 2) — Tutoriels Data Mining
- G. James et al. — *An Introduction to Statistical Learning* (ISL)
- T. Hastie et al. — *The Elements of Statistical Learning* (ESL)
- C. M. Bishop — *Pattern Recognition and Machine Learning*
- K. P. Murphy — *Probabilistic Machine Learning*
- A. Ng (Stanford / Coursera) — Machine Learning Specialization

---

## Licence

Ce contenu pédagogique est distribué sous licence **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
Vous pouvez librement réutiliser et adapter le contenu en citant l'auteur.
Voir le fichier [LICENSE](LICENSE) pour les détails.
