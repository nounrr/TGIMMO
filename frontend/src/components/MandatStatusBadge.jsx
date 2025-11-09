import React from 'react';

const map = {
  actif: { className: 'badge bg-success-subtle text-success border border-success-subtle', label: 'Actif' },
  en_cours: { className: 'badge bg-primary-subtle text-primary border border-primary-subtle', label: 'En cours' },
  termine: { className: 'badge bg-secondary-subtle text-secondary border border-secondary-subtle', label: 'Terminé' },
  resilie: { className: 'badge bg-danger-subtle text-danger border border-danger-subtle', label: 'Résilié' },
  suspendu: { className: 'badge bg-warning-subtle text-warning border border-warning-subtle', label: 'Suspendu' },
  brouillon: { className: 'badge bg-light text-dark border border-secondary', label: 'Brouillon' },
};

export default function MandatStatusBadge({ statut }) {
  const cfg = map[statut] || { className: 'badge bg-secondary-subtle text-secondary', label: statut };
  return <span className={cfg.className}>{cfg.label}</span>;
}
