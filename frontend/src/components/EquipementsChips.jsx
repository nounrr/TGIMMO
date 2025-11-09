import React from 'react';

export default function EquipementsChips({ items }) {
  if (!items || items.length === 0) return <span className="text-muted">Aucun</span>;
  return (
    <div className="d-flex flex-wrap gap-2">
      {items.map((it, idx) => (
        <span key={idx} className="badge rounded-pill bg-light text-dark border shadow-sm" style={{ fontWeight: 500 }}>
          <i className="bi bi-tools me-1"></i>{it}
        </span>
      ))}
    </div>
  );
}
