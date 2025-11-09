import React from 'react';

const map = {
  actif: { className: 'badge bg-success-subtle text-success border border-success-subtle', label: 'Actif' },
  en_attente: { className: 'badge bg-warning-subtle text-warning border border-warning-subtle', label: 'En attente' },
  resilie: { className: 'badge bg-danger-subtle text-danger border border-danger-subtle', label: 'Résilié' },
};

export default function BailStatusBadge({ statut }) {
  const cfg = map[statut] || { className: 'badge bg-secondary-subtle text-secondary', label: statut };
  return <span className={cfg.className}>{cfg.label}</span>;
}
