import React, { useState, useMemo } from 'react';
import useAuthz from '@/hooks/useAuthz';
import { useGetBailPaiementsQuery, useCreateBailPaiementMutation, useValiderPaiementMutation } from '../api/baseApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const monthNames = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];

function buildMonths(startDate, endDate, duree) {
  if (!startDate) return [];
  const start = new Date(startDate);
  start.setDate(1);
  let count = 0;
  if (endDate) {
    const end = new Date(endDate); end.setDate(1);
    count = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  } else if (duree) {
    count = duree;
  } else {
    count = 12;
  }
  return Array.from({ length: count }).map((_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
}

export default function BailPaymentsGrid({ bail }) {
  const { can } = useAuthz();
  const { id: bailId } = bail;
  const { data, isLoading } = useGetBailPaiementsQuery(bailId);
  const paiements = data?.data || [];
  const [createPaiement] = useCreateBailPaiementMutation();
  const [validerPaiement] = useValiderPaiementMutation();

  const canView = can('paiements.view');
  const canCreate = can('paiements.create');
  const canUpdate = can('paiements.update');

  const today = useMemo(() => new Date(), []);
  const defaultYear = today.getFullYear();
  const startDate = bail?.date_debut ? new Date(bail.date_debut) : null;
  const endDateRaw = bail?.date_fin ? new Date(bail.date_fin) : null;
  // If no end date, treat current date as temporary upper bound for display
  const endDate = endDateRaw || today;
  const startYear = startDate ? startDate.getFullYear() : defaultYear;
  const endYear = endDate ? endDate.getFullYear() : defaultYear;
  const [selectedYear, setSelectedYear] = useState(() => {
    // Default to current year clamped inside range
    if (defaultYear < startYear) return String(startYear);
    if (defaultYear > endYear) return String(endYear);
    return String(defaultYear);
  });
  const yearsOptions = useMemo(() => {
    const list = Array.from({ length: (endYear - startYear) + 1 }, (_, i) => String(startYear + i));
    // Add special 'ALL' option to show entire range
    if (list.length > 1) list.unshift('ALL');
    return list;
  }, [startYear, endYear]);
  const scheduleMonths = useMemo(() => {
    if (!startDate) return [];
    const startBoundary = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endBoundary = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    // If ALL selected build full range
    if (selectedYear === 'ALL') {
      const totalMonths = (endBoundary.getFullYear() - startBoundary.getFullYear()) * 12 + (endBoundary.getMonth() - startBoundary.getMonth()) + 1;
      return Array.from({ length: totalMonths }, (_, i) => {
        const d = new Date(startBoundary.getFullYear(), startBoundary.getMonth() + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
      });
    }
    const y = Number(selectedYear);
    return Array.from({ length: 12 })
      .map((_, i) => ({ year: y, month: i + 1 }))
      .filter(({ year, month }) => {
        const d = new Date(year, month - 1, 1);
        return d >= startBoundary && d <= endBoundary;
      });
  }, [selectedYear, startDate, endDate]);
  const paymentMap = useMemo(() => {
    const map = {};
    paiements.forEach(p => { map[`${p.period_year}-${p.period_month}`] = p; });
    return map;
  }, [paiements]);
  const lastPeriod = scheduleMonths.length ? scheduleMonths[scheduleMonths.length - 1] : null;
  const isCurrentPeriod = (y, m) => today.getFullYear() === y && (today.getMonth() + 1) === m;
  const isLastPeriod = (y, m) => lastPeriod && lastPeriod.year === y && lastPeriod.month === m;

  const canPay = (p, y, m) => {
    if (!canCreate && !canUpdate) return false;
    if (p && p.status === 'valide') return false;
    // Allow paying any selected month/year (including after current and after résiliation)
    return true;
  };

  if (!canView) return null;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPeriod, setPendingPeriod] = useState(null); // {year, month}
  const [mode, setMode] = useState('espece');
  const [reference, setReference] = useState('');
  const [chequeImage, setChequeImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const storageBase = apiBase.replace(/\/api\/v1$/, '');

  const openConfirm = (year, month) => {
    setPendingPeriod({ year, month });
    setMode('espece');
    setReference('');
    setChequeImage(null);
    setNotes('');
    setConfirmOpen(true);
  };

  const endOfMonth = (y,m) => new Date(y, m, 0).toISOString().slice(0,10);

  const submitPayment = async () => {
    if (!pendingPeriod) return;
    setIsSubmitting(true);
    try {
      const { year, month } = pendingPeriod;
      const key = `${year}-${month}`;
      const existing = paymentMap[key];
      let paiementId;
      if (!existing) {
        const created = await createPaiement({ bailId, payload: {
          period_month: month,
          period_year: year,
          amount_due: Number(bail.montant_loyer) + Number(bail.charges || 0),
          due_date: endOfMonth(year, month),
          notes: notes || undefined
        }}).unwrap();
        paiementId = created.data.id;
      } else {
        paiementId = existing.id;
      }
      await validerPaiement({ id: paiementId, method: mode, reference: reference || undefined, cheque_image: mode === 'cheque' ? chequeImage : undefined });
      setConfirmOpen(false);
      setPendingPeriod(null);
    } catch (error) {
      console.error("Payment failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorClasses = (p, year, month) => {
    if (p && p.status === 'valide') return 'bg-green-600 text-white border-green-700';
    const isCurrent = isCurrentPeriod(year, month);
    const lastP = isLastPeriod(year, month);
    if (bail.statut === 'resilie') {
      if (lastP) return 'bg-red-600 text-white border-red-700';
    } else if (isCurrent) {
      return 'bg-red-600 text-white border-red-700';
    }
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Label>Année</Label>
        <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Année" /></SelectTrigger>
          <SelectContent>
            {yearsOptions.map(y => (
              <SelectItem key={y} value={y}>{y === 'ALL' ? 'Tous' : y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading && <span className="text-xs text-slate-500">Chargement...</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {scheduleMonths.map(({ year, month }) => {
          const key = `${year}-${month}`;
          const p = paymentMap[key];
          return (
            <div key={key} className={`border rounded flex flex-col justify-between text-xs ${colorClasses(p, year, month)} min-h-32`}>
              <div className="p-2 flex flex-col gap-1">
                <span className="font-semibold leading-tight text-sm">{monthNames[month-1]} {String(year).slice(-2)}</span>
                <div className="text-xs opacity-90 font-medium">{p ? (p.amount_due + ' MAD') : (Number(bail.montant_loyer) + Number(bail.charges || 0)) + ' MAD'}</div>
                {/* Paid: keep green styling but no label */}
              </div>
              <div className="p-2 pt-0 flex flex-col gap-1">
                {canPay(p, year, month) && (
                  <Button size="xs" variant="outline" className="bg-white text-slate-700 hover:bg-slate-100 w-full" onClick={() => openConfirm(year, month)}>
                    {p ? 'Valider' : 'Payer'}
                  </Button>
                )}
                {p && p.status === 'valide' && (
                  <Button size="xs" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 w-full" onClick={() => { setDetailPayment(p); setDetailOpen(true); }}>Détails</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmation paiement</DialogTitle>
          </DialogHeader>
          {pendingPeriod && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-500">Période</div>
                  <div className="font-medium">{monthNames[pendingPeriod.month-1]} {pendingPeriod.year}</div>
                </div>
                <div>
                  <div className="text-slate-500">Montant dû</div>
                  <div className="font-medium">{Number(bail.montant_loyer) + Number(bail.charges || 0)} MAD</div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Mode de paiement</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espece">Espèce</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Référence (optionnel)</Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Réf. transaction" />
              </div>
              {mode === 'cheque' && (
                <div className="space-y-1">
                  <Label>Photo du chèque</Label>
                  <Input type="file" accept="image/*" onChange={e => setChequeImage(e.target.files?.[0] || null)} />
                  {chequeImage && <div className="text-[10px] text-slate-500">{chequeImage.name}</div>}
                </div>
              )}
              <div className="space-y-1">
                <Label>Notes (optionnel)</Label>
                <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>Annuler</Button>
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={submitPayment} disabled={isSubmitting}>
                  {isSubmitting ? 'Traitement...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
          </DialogHeader>
          {detailPayment && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-500">Période</div>
                  <div className="font-medium">{monthNames[detailPayment.period_month-1]} {detailPayment.period_year}</div>
                </div>
                <div>
                  <div className="text-slate-500">Montant</div>
                  <div className="font-medium">{detailPayment.amount_due} MAD</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-500">Mode</div>
                  <div className="font-medium">{detailPayment.method || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Référence</div>
                  <div className="font-medium">{detailPayment.reference || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-slate-500">Payé le</div>
                  <div className="font-medium">{detailPayment.paid_at || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Échéance</div>
                  <div className="font-medium">{detailPayment.due_date || '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Notes</div>
                <div className="p-2 rounded bg-slate-50 border text-[11px] min-h-[40px] whitespace-pre-wrap">{detailPayment.notes || '—'}</div>
              </div>
              {detailPayment.cheque_image_path && (
                <div className="space-y-1">
                  <div className="text-slate-500">Chèque</div>
                  <img
                    src={`${storageBase}/storage/${detailPayment.cheque_image_path}`}
                    alt="Chèque"
                    className="rounded border max-h-40 object-contain bg-white"
                    onError={(e)=>{ e.currentTarget.replaceWith(document.createTextNode('Image indisponible')); }}
                  />
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={()=>{ setDetailOpen(false); setDetailPayment(null); }}>Fermer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}