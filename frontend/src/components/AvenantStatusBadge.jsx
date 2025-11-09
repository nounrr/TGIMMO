import React from 'react';

const map = {
  actif: { className: 'badge bg-success-subtle text-success border border-success-subtle', label: 'Actif' },
  en_attente: { className: 'badge bg-warning-subtle text-warning border border-warning-subtle', label: 'En attente' },
  applique: { className: 'badge bg-primary-subtle text-primary border border-primary-subtle', label: 'Appliqué' },
  annule: { className: 'badge bg-danger-subtle text-danger border border-danger-subtle', label: 'Annulé' },
  brouillon: { className: 'badge bg-light text-dark border border-secondary', label: 'Brouillon' },
  valide: { className: 'badge bg-info-subtle text-info border border-info-subtle', label: 'Validé' },
};

export default function AvenantStatusBadge({ statut }) {
  const cfg = map[statut] || { className: 'badge bg-secondary-subtle text-secondary', label: statut };
  return <span className={cfg.className}>{cfg.label}</span>;
}
