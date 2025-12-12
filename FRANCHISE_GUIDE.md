# Système de Franchises de Loyer

## Vue d'ensemble

Le système de franchises permet de définir des périodes durant lesquelles le loyer bénéficie d'une remise comprise entre 0% et 100%.

## Cas d'usage

- **Période de grâce** : Offrir 100% de remise pendant les 2 premiers mois
- **Promotion** : Réduction de 20% pendant 6 mois pour attirer un locataire
- **Travaux** : 50% de remise pendant la durée des rénovations
- **Difficulté temporaire** : Accord de réduction temporaire avec le locataire

## Fonctionnalités

### Backend (Laravel)

**Modèles**
- `FranchiseBail` : Gère les périodes de franchise
  - `bail_id` : Référence au bail
  - `date_debut` / `date_fin` : Période de la franchise
  - `pourcentage_remise` : 0.00 à 100.00
  - `motif` : Raison de la franchise (optionnel)

- `Bail` : Méthodes étendues
  - `getFranchiseActive($date)` : Récupère la franchise active à une date
  - `calculerLoyerAvecFranchise($date)` : Calcule le loyer avec franchise appliquée

**Validation**
- Prévention des chevauchements de périodes
- Vérification des pourcentages (0-100)
- Validation des dates (fin > début)

**API Endpoints**

```
GET    /api/v1/baux/{bail}/franchises           - Liste des franchises d'un bail
POST   /api/v1/franchises                        - Créer une franchise
GET    /api/v1/franchises/{franchise}            - Détails d'une franchise
PATCH  /api/v1/franchises/{franchise}            - Modifier une franchise
DELETE /api/v1/franchises/{franchise}            - Supprimer une franchise
POST   /api/v1/baux/{bail}/calculer-loyer       - Calculer loyer avec franchise
```

**Exemple de réponse - Calcul loyer**
```json
{
  "bail_id": 1,
  "date": "2025-12-15",
  "loyer_normal": 4500.00,
  "loyer_avec_franchise": 2250.00,
  "franchise_active": {
    "id": 2,
    "date_debut": "2025-12-01",
    "date_fin": "2025-12-31",
    "pourcentage_remise": "50.00",
    "motif": "Période de grâce"
  }
}
```

### Frontend (React)

**Composants**

1. **BailFranchiseManager** (`src/components/BailFranchiseManager.jsx`)
   - Interface complète de gestion des franchises
   - CRUD complet avec validation
   - Détection visuelle des périodes actives
   - Intégré dans la page d'édition de bail

2. **FranchiseActiveBadge** (`src/components/FranchiseActiveBadge.jsx`)
   - Badge affichant la remise active
   - Peut être utilisé dans les listes de baux

**Utilitaires** (`src/utils/franchiseUtils.js`)
- `isFranchiseActive(franchise, date)` : Vérifie si une franchise est active
- `getActiveFranchise(franchises, date)` : Récupère la franchise active
- `calculerLoyerAvecFranchise(bail, date)` : Calcule le loyer côté client
- `periodesSeOverlap(d1, f1, d2, f2)` : Détecte les chevauchements
- `formatMontant(montant)` : Formatage en MAD

**Hooks Redux**
```javascript
import {
  useGetBailFranchisesQuery,
  useCreateFranchiseMutation,
  useUpdateFranchiseMutation,
  useDeleteFranchiseMutation,
  useCalculerLoyerAvecFranchiseMutation,
} from '@/api/baseApi';
```

## Utilisation

### 1. Accéder à la gestion des franchises

1. Aller dans **Baux**
2. Cliquer sur un bail pour le modifier
3. Descendre à la section **Franchises de loyer**
4. Cliquer sur **Ajouter une franchise**

### 2. Créer une franchise

```javascript
const [createFranchise] = useCreateFranchiseMutation();

const handleCreate = async () => {
  await createFranchise({
    bail_id: 1,
    date_debut: '2025-12-01',
    date_fin: '2026-02-28',
    pourcentage_remise: 100,
    motif: 'Période de grâce - 3 mois gratuits',
  });
};
```

### 3. Calculer le loyer avec franchise

```javascript
import { calculerLoyerAvecFranchise } from '@/utils/franchiseUtils';

const bail = { 
  montant_loyer: 4500, 
  franchises: [
    { 
      date_debut: '2025-12-01', 
      date_fin: '2025-12-31', 
      pourcentage_remise: 50 
    }
  ] 
};

const result = calculerLoyerAvecFranchise(bail, '2025-12-15');
// {
//   loyerNormal: 4500,
//   loyerAvecFranchise: 2250,
//   franchiseActive: { ... },
//   pourcentageRemise: 50
// }
```

### 4. Afficher un badge de franchise active

```javascript
import FranchiseActiveBadge from '@/components/FranchiseActiveBadge';

<FranchiseActiveBadge franchises={bail.franchises} />
```

## Validation des données

### Backend
- **Dates** : date_fin doit être >= date_debut
- **Pourcentage** : entre 0.00 et 100.00
- **Chevauchement** : Une erreur est retournée si deux franchises se chevauchent

### Frontend
- Validation en temps réel dans le formulaire
- Messages d'erreur clairs
- Prévention de la soumission si données invalides

## Exemples pratiques

### Exemple 1 : Période de grâce (3 mois gratuits)
```json
{
  "bail_id": 1,
  "date_debut": "2025-01-01",
  "date_fin": "2025-03-31",
  "pourcentage_remise": 100,
  "motif": "Période de grâce - 3 premiers mois gratuits"
}
```

### Exemple 2 : Réduction progressive
```json
[
  {
    "bail_id": 1,
    "date_debut": "2025-01-01",
    "date_fin": "2025-03-31",
    "pourcentage_remise": 50,
    "motif": "Réduction 50% - trimestre 1"
  },
  {
    "bail_id": 1,
    "date_debut": "2025-04-01",
    "date_fin": "2025-06-30",
    "pourcentage_remise": 25,
    "motif": "Réduction 25% - trimestre 2"
  }
]
```

### Exemple 3 : Travaux temporaires
```json
{
  "bail_id": 1,
  "date_debut": "2025-06-01",
  "date_fin": "2025-06-15",
  "pourcentage_remise": 75,
  "motif": "Travaux de rénovation - gêne importante"
}
```

## Intégration future

### Suggestions pour l'intégration complète

1. **Paiements** : Lors de la création d'un paiement, utiliser `calculerLoyerAvecFranchise()` au lieu du loyer brut
   
2. **États de compte** : Afficher le loyer normal + la remise appliquée pour la transparence

3. **Notifications** : Alerter quand une franchise arrive à expiration

4. **Rapports** : Calculer le manque à gagner total dû aux franchises

5. **Dashboard** : Widget affichant les franchises actives du mois

## Base de données

**Table : `franchise_bail`**
```sql
CREATE TABLE franchise_bail (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bail_id BIGINT UNSIGNED NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    pourcentage_remise DECIMAL(5,2) NOT NULL,
    motif TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (bail_id) REFERENCES baux(id) ON DELETE CASCADE,
    INDEX idx_bail_dates (bail_id, date_debut, date_fin)
);
```

## Notes techniques

- Les dates sont stockées au format `DATE` (pas de timestamp)
- Les calculs utilisent des `DECIMAL` pour éviter les erreurs d'arrondi
- La suppression d'un bail supprime automatiquement ses franchises (CASCADE)
- L'index sur `(bail_id, date_debut, date_fin)` optimise les requêtes de chevauchement

## Support

Pour toute question ou amélioration, contactez l'équipe de développement.
