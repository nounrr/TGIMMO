# Nouvelle Structure des Mandats - Multiple Unités et Propriétaires

## 📋 Résumé des changements

### Problème initial
- Un mandat ne pouvait être lié qu'à **une seule unité** (via `unite_id`)
- Les propriétaires étaient liés via `unites_proprietaires` avec `mandat_id`
- Difficile de créer un mandat pour plusieurs unités

### Solution implémentée
Un mandat peut maintenant être lié à **plusieurs unités** ET **plusieurs propriétaires** automatiquement.

## 🗄️ Structure de la base de données

### Nouvelle table : `mandat_unites`
Table pivot pour la relation many-to-many entre mandats et unités :
```sql
CREATE TABLE mandat_unites (
    id BIGINT PRIMARY KEY,
    mandat_id BIGINT FOREIGN KEY -> mandats_gestion.id,
    unite_id BIGINT FOREIGN KEY -> unites.id,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(mandat_id, unite_id)
)
```

### Modification : `unites_proprietaires`
- **SUPPRIMÉ** : colonne `mandat_id`
- **GARDÉ** : colonne `unite_id`
- Maintenant : lie directement les propriétaires aux unités (pas aux mandats)

### Table `mandats_gestion`
- **GARDÉ** : colonne `unite_id` (nullable, pour compatibilité)
- Les unités sont maintenant gérées via la table pivot `mandat_unites`

## 🔗 Relations Eloquent

### MandatGestion.php
```php
// Relation many-to-many avec les unités
public function unites() {
    return $this->belongsToMany(Unite::class, 'mandat_unites', 'mandat_id', 'unite_id')
                ->withTimestamps();
}

// Récupérer tous les propriétaires des unités liées
public function getAllProprietaires() {
    $proprietaireIds = [];
    foreach ($this->unites as $unite) {
        foreach ($unite->proprietaires as $prop) {
            $proprietaireIds[$prop->id] = $prop;
        }
    }
    return collect(array_values($proprietaireIds));
}
```

### UniteProprietaire.php
```php
protected $fillable = [
    'unite_id',          // Lié à l'unité
    'proprietaire_id',
    'part_numerateur',
    'part_denominateur',
    'pourcentage',
    'date_debut',
    'date_fin',
];

public function unite() {
    return $this->belongsTo(Unite::class, 'unite_id');
}
```

## 📡 API Backend

### POST /api/v1/mandats-gestion
**Nouveau format de requête** :
```json
{
  "unite_ids": [1, 2, 3],  // Array d'IDs d'unités
  "date_debut": "2025-01-01",
  "date_fin": "2026-01-01",
  "statut": "brouillon",
  "reference": "REF-2025-001",
  "mandat_id": "M-2025-001",
  "taux_gestion_pct": 5.00,
  // ... autres champs
}
```

**Comportement** :
1. Crée le mandat
2. Attache toutes les unités sélectionnées via `mandat_unites`
3. Les propriétaires sont automatiquement récupérés via `unites.proprietaires`

### PUT /api/v1/mandats-gestion/{id}
```json
{
  "unite_ids": [1, 4, 5],  // Remplace les unités existantes
  // ... autres champs
}
```

### GET /api/v1/mandats-gestion
**Réponse inclut** :
```json
{
  "data": [
    {
      "id": 1,
      "reference": "REF-2025-001",
      "unites": [
        {
          "id": 1,
          "numero_unite": "A101",
          "proprietaires": [
            { "id": 1, "nom_raison": "SARL ABC" },
            { "id": 2, "nom_raison": "Mohamed Ali" }
          ]
        },
        {
          "id": 2,
          "numero_unite": "A102",
          "proprietaires": [...]
        }
      ]
    }
  ]
}
```

## 🖥️ Frontend

### Page de création : `/mandats/nouveau`
**Composant** : `CreateMandatShadcn.jsx`

**Fonctionnalités** :
1. **Sélection multiple d'unités**
   - Interface graphique avec cartes cliquables
   - Sélection/désélection par clic
   - Badges récapitulatifs

2. **Affichage automatique des propriétaires**
   - Dès qu'une unité est sélectionnée
   - Récupère les propriétaires via `unite.proprietaires`
   - Affiche les unités associées à chaque propriétaire

3. **Formulaire du mandat**
   - Dates début/fin
   - Référence
   - Statut
   - Taux de gestion
   - Pouvoirs accordés
   - Notes et clauses

### Workflow utilisateur
```
1. Cliquer sur "Nouveau mandat" dans /mandats
   ↓
2. Sélectionner une ou plusieurs unités (cartes cliquables)
   ↓
3. Voir automatiquement les propriétaires associés
   ↓
4. Remplir les informations du mandat
   ↓
5. Cliquer sur "Créer le mandat"
   ↓
6. Redirection vers /mandats/{id} pour édition
```

## 💡 Avantages de cette approche

### ✅ Flexibilité
- Un mandat peut gérer 1 ou 100 unités
- Propriétaires automatiquement liés via les unités

### ✅ Cohérence des données
- `unites_proprietaires` lie propriétaires → unités (relation logique)
- Pas de duplication d'information
- Un seul endroit pour gérer la propriété

### ✅ Interface intuitive
- Sélection visuelle des unités
- Aperçu immédiat des propriétaires concernés
- Pas besoin de sélectionner manuellement les propriétaires

### ✅ Évolutivité
- Facile d'ajouter/retirer des unités d'un mandat existant
- Les propriétaires suivent automatiquement

## 🔄 Workflow recommandé

### Étape 1 : Gérer les liaisons Unité-Propriétaire
```
/unites/{id}/owners
- Ajouter/modifier les propriétaires d'une unité
- Définir les parts de propriété (%, numérateur/dénominateur)
```

### Étape 2 : Créer le mandat
```
/mandats/nouveau
- Sélectionner les unités concernées
- Les propriétaires apparaissent automatiquement
- Remplir les informations du mandat
```

### Étape 3 : Gérer le mandat
```
/mandats/{id}
- Modifier les dates, statut, clauses
- Ajouter/retirer des unités
- Générer le document PDF
```

## 📝 Migrations appliquées

1. `2025_12_11_150000_create_mandat_unites_table.php`
   - Crée la table pivot `mandat_unites`
   - Rend `unite_id` nullable dans `mandats_gestion`

2. `2025_12_11_150001_update_unites_proprietaires_structure.php`
   - Supprime `mandat_id` de `unites_proprietaires`
   - Assure que `unite_id` existe

## 🎯 Cas d'usage

### Exemple 1 : Mandat pour un immeuble entier
```
Unités sélectionnées : A101, A102, A103, A104
Propriétaires automatiques :
  - SARL Immobilière (A101, A102)
  - Mohamed Ali (A103)
  - Fatima Zahra (A104)
```

### Exemple 2 : Mandat pour copropriété
```
Unités sélectionnées : B201, B202
Propriétaires automatiques :
  - Ahmed & Sarah (50% de B201 + 100% de B202)
  - Karim (50% de B201)
```

## 🚀 Prochaines étapes possibles

1. **Édition des unités dans un mandat existant**
   - Page `/mandats/{id}/edit` avec modification des unités

2. **Génération PDF améliorée**
   - Liste de toutes les unités dans le document
   - Tableau récapitulatif des propriétaires

3. **Avenants multi-unités**
   - Avenant affectant toutes les unités d'un mandat
   - Ou seulement certaines unités

4. **Statistiques et rapports**
   - Nombre d'unités par mandat
   - Total de propriétaires uniques
   - Revenus locatifs cumulés

## 📞 Support

Pour toute question sur cette nouvelle structure :
- Backend : Vérifier `MandatGestionController.php`
- Frontend : Vérifier `CreateMandatShadcn.jsx`
- Relations : Vérifier les modèles Eloquent
