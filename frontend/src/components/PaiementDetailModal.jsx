import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const monthNames = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // If time is 00:00, show only date
  if (hours === '00' && minutes === '00') {
    return `${day}/${month}/${year}`;
  }
  return `${day}/${month}/${year} à ${hours}:${minutes}`;
};

export default function PaiementDetailModal({ open, onClose, paiement }) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const storageBase = apiBase.replace(/\/api\/v1$/, '');

  if (!paiement) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails du paiement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-slate-500">Période</div>
              <div className="font-medium">{monthNames[paiement.period_month-1]} {paiement.period_year}</div>
            </div>
            <div>
              <div className="text-slate-500">Montant</div>
              <div className="font-medium">{paiement.amount_due} MAD</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-slate-500">Mode</div>
              <div className="font-medium">{paiement.method || '-'}</div>
            </div>
            <div>
              <div className="text-slate-500">Référence</div>
              <div className="font-medium">{paiement.reference || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-slate-500">Payé le</div>
              <div className="font-medium">{formatDate(paiement.paid_at)}</div>
            </div>
            <div>
              <div className="text-slate-500">Échéance</div>
              <div className="font-medium">{formatDate(paiement.due_date)}</div>
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1">Notes</div>
            <div className="p-2 rounded bg-slate-50 border text-[11px] min-h-[40px] whitespace-pre-wrap">
              {paiement.notes || '—'}
            </div>
          </div>
          {paiement.cheque_image_path && (
            <div className="space-y-1">
              <div className="text-slate-500">Chèque</div>
              <img
                src={`${storageBase}/storage/${paiement.cheque_image_path}`}
                alt="Chèque"
                className="rounded border max-h-40 object-contain bg-white"
                onError={(e)=>{ e.currentTarget.replaceWith(document.createTextNode('Image indisponible')); }}
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
