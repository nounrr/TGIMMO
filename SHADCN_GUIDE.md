# Guide d'utilisation des composants shadcn/ui

## Installation réussie ✓

Les composants suivants ont été installés :
- Button
- Table
- Card
- Dialog
- Form
- Input
- Label
- Select
- Badge
- Alert Dialog
- Toast
- Dropdown Menu

## Exemple : Page Employés

La nouvelle page `EmployesShadcn.jsx` démontre l'utilisation complète des composants shadcn/ui :

### Fonctionnalités implémentées :

1. **Table avec tri et pagination**
   - Tri des colonnes
   - Pagination serveur
   - Recherche et filtres

2. **Dialog pour formulaire d'ajout/modification**
   - Formulaire complet avec validation
   - Gestion des rôles
   - Support création et édition

3. **AlertDialog pour confirmation de suppression**
   - Confirmation avant suppression
   - État de chargement

4. **Toast pour notifications**
   - Notifications de succès
   - Notifications d'erreur

5. **Composants de formulaire**
   - Input
   - Select
   - Label
   - Badge (pour sélection de rôles)

6. **Menu dropdown pour actions**
   - Modifier
   - Supprimer

## Comment ajouter d'autres composants shadcn/ui

Pour ajouter de nouveaux composants :

```bash
npx shadcn@latest add [nom-composant]
```

Exemples :
```bash
npx shadcn@latest add accordion
npx shadcn@latest add tabs
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add textarea
npx shadcn@latest add popover
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
```

## Structure de la page type avec shadcn/ui

```jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MaPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Titre de la page</h1>
        <Button onClick={() => setOpen(true)}>
          Ajouter
        </Button>
      </div>

      {/* Contenu */}
      <Card>
        <CardHeader>
          <CardTitle>Section</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Votre contenu ici */}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Titre du modal</DialogTitle>
          </DialogHeader>
          {/* Contenu du modal */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## Notifications Toast

Pour utiliser les toasts, importez le hook :

```jsx
import { useToast } from '@/hooks/use-toast';

function MonComposant() {
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Succès",
      description: "L'action a été effectuée avec succès.",
    });
  };

  // Pour les erreurs
  const handleError = () => {
    toast({
      title: "Erreur",
      description: "Une erreur s'est produite.",
      variant: "destructive",
    });
  };
}
```

## Prochaines étapes

Vous pouvez maintenant créer d'autres pages en utilisant les mêmes composants shadcn/ui :
- Locataires
- Propriétaires
- Unités
- Mandats
- Baux
- etc.

Tous ces pages peuvent suivre le même modèle que `EmployesShadcn.jsx`.
