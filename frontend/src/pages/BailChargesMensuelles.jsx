import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthz from '@/hooks/useAuthz';
import { useGetBailQuery, useGetBailChargesMensuellesQuery } from '../api/baseApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Table as TableIcon } from 'lucide-react';

export default function BailChargesMensuelles() {
  const { can } = useAuthz();
  const { id } = useParams();
  const navigate = useNavigate();

  if (!can('charges.view')) {
    return <div className="p-6 text-red-500">Vous n'avez pas la permission de voir les charges.</div>;
  }

  const { data: bailData, isLoading: bailLoading } = useGetBailQuery(id);
  const { data: charges, isLoading: chargesLoading, refetch } = useGetBailChargesMensuellesQuery(id);

  const bail = bailData?.data || bailData;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-indigo-100 text-indigo-700"><TableIcon className="h-5 w-5" /></div>
            <h1 className="text-xl font-semibold">Charges mensuelles du bail</h1>
          </div>
          <p className="text-sm text-slate-500">Bail #{id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/baux/${id}`)} className="gap-2" type="button"><ArrowLeft className="h-4 w-4" /> Retour bail</Button>
          <Button variant="outline" onClick={refetch} type="button">Rafraîchir</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent>
          {bailLoading && <div className="text-sm text-slate-500">Chargement bail...</div>}
          {bail && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1"><div className="text-slate-500">Numéro</div><div className="font-medium">{bail.numero_bail || bail.id}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Locataire</div><div className="font-medium">{bail.locataire?.prenom} {bail.locataire?.nom}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Unité</div><div className="font-medium">{bail.unite?.numero_unite || bail.unite?.reference || bail.unite_id}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Loyer (HT charges)</div><div className="font-medium">{bail.montant_loyer} MAD</div></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Détail mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          {chargesLoading && <div className="text-sm text-slate-500">Chargement des charges...</div>}
          {!chargesLoading && (!charges || charges.length === 0) && <div className="text-sm text-slate-500">Aucune charge trouvée.</div>}
          {!chargesLoading && charges && charges.length > 0 && (
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Mois</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                    <th className="px-3 py-2 font-medium">Locataire</th>
                    <th className="px-3 py-2 font-medium">Propriétaire</th>
                    <th className="px-3 py-2 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((m) => (
                    <tr key={m.mois} className="border-t">
                      <td className="px-3 py-2 font-medium flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> {m.mois}</td>
                      <td className="px-3 py-2">{Number(m.total).toFixed(2)} MAD</td>
                      <td className="px-3 py-2 text-emerald-700">{Number(m.total_locataire).toFixed(2)} MAD</td>
                      <td className="px-3 py-2 text-indigo-700">{Number(m.total_proprietaire).toFixed(2)} MAD</td>
                      <td className="px-3 py-2">
                        <details>
                          <summary className="cursor-pointer text-slate-600 hover:text-slate-800">Voir</summary>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            {m.details.map(d => (
                              <li key={d.id} className="text-xs text-slate-600">#{d.id} • {d.charge_to} • {Number(d.montant).toFixed(2)} MAD {d.notes ? `• ${d.notes}` : ''}</li>
                            ))}
                          </ul>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4">
        <Link to={`/baux/${id}`}>Retour au bail</Link>
      </div>
    </div>
  );
}
