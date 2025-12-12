import { Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Composant pour afficher un badge indiquant si une franchise est active
 * @param {Object} props
 * @param {Array} props.franchises - Liste des franchises du bail
 * @param {string} props.date - Date à vérifier (format YYYY-MM-DD), par défaut aujourd'hui
 */
export default function FranchiseActiveBadge({ franchises = [], date = null }) {
  if (!franchises || franchises.length === 0) return null;

  const checkDate = date ? new Date(date) : new Date();
  checkDate.setHours(0, 0, 0, 0);

  const activeFranchise = franchises.find((f) => {
    const debut = new Date(f.date_debut);
    const fin = new Date(f.date_fin);
    debut.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    return checkDate >= debut && checkDate <= fin;
  });

  if (!activeFranchise) return null;

  return (
    <Badge 
      variant="outline" 
      className="px-2 py-1 text-xs border-0 bg-green-100 text-green-700 flex items-center gap-1"
    >
      <Percent className="h-3 w-3" />
      -{activeFranchise.pourcentage_remise}%
    </Badge>
  );
}
