import React from 'react';
import { Badge } from "@/components/ui/badge";

const map = {
  actif: { className: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200', label: 'Actif' },
  en_attente: { className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200', label: 'En attente' },
  resilie: { className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200', label: 'Résilié' },
  termine: { className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200', label: 'Terminé' },
};

export default function BailStatusBadge({ statut }) {
  const cfg = map[statut] || { className: 'bg-slate-100 text-slate-700 hover:bg-slate-100', label: statut };
  return <Badge variant="outline" className={`${cfg.className} border`}>{cfg.label}</Badge>;
}
