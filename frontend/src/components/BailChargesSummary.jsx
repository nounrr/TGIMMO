import React from 'react';
import useAuthz from '@/hooks/useAuthz';
import { useGetBailChargesMensuellesQuery } from '@/api/baseApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function BailChargesSummary({ bail }) {
  const { can } = useAuthz();
  const bailId = bail?.id;
  const { data: charges = [], isLoading, refetch } = useGetBailChargesMensuellesQuery(bailId, { skip: !bailId });

  if (!can('charges.view')) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Charges mensuelles (résumé)</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>Rafraîchir</Button>
          <Link to={`/baux/${bailId}/charges`} state={{ bail }}>
            <Button size="sm" variant="secondary">Voir détails</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-xs text-slate-500 py-2">Chargement des charges...</div>}
        {!isLoading && charges.length === 0 && (
          <div className="text-xs text-slate-500 py-2">Aucune charge enregistrée pour ce bail.</div>
        )}
        {!isLoading && charges.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-2 py-1">Mois</th>
                  <th className="px-2 py-1">Total</th>
                  <th className="px-2 py-1">Locataire</th>
                  <th className="px-2 py-1">Propriétaire</th>
                  <th className="px-2 py-1">Nb imputations</th>
                </tr>
              </thead>
              <tbody>
                {charges.slice(0,6).map(m => (
                  <tr key={m.mois} className="border-t">
                    <td className="px-2 py-1 font-medium flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> {m.mois}</td>
                    <td className="px-2 py-1">{Number(m.total).toFixed(2)} MAD</td>
                    <td className="px-2 py-1 text-emerald-700">{Number(m.total_locataire).toFixed(2)} MAD</td>
                    <td className="px-2 py-1 text-indigo-700">{Number(m.total_proprietaire).toFixed(2)} MAD</td>
                    <td className="px-2 py-1">{m.details.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {charges.length > 6 && (
              <div className="mt-2 text-[11px] text-slate-500">Affichage limité aux 6 derniers mois – voir détails pour tout l'historique.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
