import React from 'react';
import useAuthz from '@/hooks/useAuthz';
import { useGetBailChargesMensuellesQuery } from '@/api/baseApi';
import { CalendarDays, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function MonthCard({ m }) {
  const hasNotes = m.details?.some(d => d.notes && d.notes.trim() !== '');
  const firstNote = hasNotes ? m.details.find(d => d.notes && d.notes.trim() !== '')?.notes : null;
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 font-semibold text-sm text-slate-800">
          <CalendarDays className="h-4 w-4 text-indigo-500" /> {m.mois}
        </div>
        {hasNotes && <StickyNote className="h-4 w-4 text-amber-500" title="Notes présentes" />}
      </div>
      <div className="text-xs flex flex-col gap-1">
        <div><span className="text-slate-500">Total:</span> <span className="font-medium">{Number(m.total).toFixed(2)} MAD</span></div>
        <div className="flex justify-between">
          <span className="text-emerald-700">Loc: {Number(m.total_locataire).toFixed(2)}</span>
          <span className="text-indigo-700">Prop: {Number(m.total_proprietaire).toFixed(2)}</span>
        </div>
        <div className="text-[11px] text-slate-500">{m.details.length} imputation(s)</div>
        {firstNote && (
          <div className="text-[11px] mt-1 italic line-clamp-2" title={firstNote}>
            "{firstNote.slice(0,90)}{firstNote.length>90?'…':''}"
          </div>
        )}
      </div>
    </div>
  );
}

export default function BailChargesSquares({ bail }) {
  const { can } = useAuthz();
  const bailId = bail?.id;
  const { data: charges = [], isLoading, refetch } = useGetBailChargesMensuellesQuery(bailId, { skip: !bailId });

  if (!can('charges.view')) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Charges mensuelles (cartes)</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>Rafraîchir</Button>
          <Link to={`/baux/${bailId}/charges`} state={{ bail }}>
            <Button size="sm" variant="secondary">Détails</Button>
          </Link>
        </div>
      </div>
      {isLoading && <div className="text-xs text-slate-500">Chargement...</div>}
      {!isLoading && charges.length === 0 && <div className="text-xs text-slate-500">Aucune charge pour ce bail.</div>}
      {!isLoading && charges.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {charges.slice(0,12).map(m => <MonthCard key={m.mois} m={m} />)}
        </div>
      )}
      {charges.length > 12 && (
        <div className="text-[11px] text-slate-500">Affichage limité à 12 mois - voir détails pour l'historique complet.</div>
      )}
    </div>
  );
}
