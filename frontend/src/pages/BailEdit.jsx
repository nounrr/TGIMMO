import React from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useGetBailQuery, useUpdateBailMutation } from '../api/baseApi';
import BailForm from './BailForm';
import { PERMS } from '../utils/permissionKeys';
import useAuthz from '../hooks/useAuthz';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, KeyRound, FileDown, ArrowLeft, Pencil } from 'lucide-react';
import BailPaymentsGrid from '../components/BailPaymentsGrid';
import BailChargesSummary from '../components/BailChargesSummary';
import BailChargesSquares from '../components/BailChargesSquares';

export default function BailEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuthz();
  const bailState = location.state?.bail;
  const skipFetch = !!bailState;
  const { data, isLoading } = useGetBailQuery(id, { skip: skipFetch });
  const [updateBail, { isLoading: saving }] = useUpdateBailMutation();

  const bail = bailState || data?.data || data;

  const onSubmit = async (payload) => {
    try {
      await updateBail({ id, payload }).unwrap();
      navigate('/baux');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour du bail');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/baux/${id}/docx`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Echec du téléchargement');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `bail_${id}.docx`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
    } catch (e) { console.error(e); alert("Impossible de télécharger le document du bail."); }
  };

  if (!bail && isLoading) {
    return <div className="p-8 text-center text-slate-500">Chargement du bail...</div>;
  }
  if (!bail) {
    return <div className="p-8 text-center text-red-600">Bail introuvable</div>;
  }

  const statusBadge = (s) => {
    const cfg = {
      actif: { cls: 'bg-green-100 text-green-700', label: 'Actif' },
      en_attente: { cls: 'bg-amber-100 text-amber-700', label: 'En attente' },
      resilie: { cls: 'bg-red-100 text-red-700', label: 'Résilié' }
    }[s];
    return cfg ? <Badge variant="outline" className={`px-2 py-1 text-xs border-0 ${cfg.cls}`}>{cfg.label}</Badge> : null;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-indigo-100 text-indigo-700">{<Pencil className="h-5 w-5" />}</div>
            <h1 className="text-xl font-semibold text-slate-900">Modifier le bail</h1>
          </div>
          <p className="text-sm text-slate-500">Bail #{bail.id} • {bail.numero_bail}</p>
          <div className="flex gap-2 pt-1 items-center">
            {statusBadge(bail.statut)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/baux')} className="gap-2" type="button"><ArrowLeft className="h-4 w-4" /> Retour</Button>
          <Link to={`/baux/${id}/remise-cles`}>
            <Button variant="outline" className="gap-2" type="button"><KeyRound className="h-4 w-4" /> Remise de clés</Button>
          </Link>
          <Link to={`/baux/${id}/charges`}>
            <Button variant="outline" className="gap-2" type="button"><FileText className="h-4 w-4" /> Charges mensuelles</Button>
          </Link>
          {can(PERMS.baux.download) && (
            <Button onClick={handleDownloadDocx} className="gap-2 bg-emerald-600 hover:bg-emerald-700" type="button"><FileDown className="h-4 w-4" /> DOCX</Button>
          )}
        </div>
      </div>

      {/* Info rapide */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Informations rapides</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1"><div className="text-slate-500">Numéro de bail</div><div className="font-medium">{bail.numero_bail || `#${bail.id}`}</div></div>
            <div className="space-y-1"><div className="text-slate-500">Locataire</div><div className="font-medium">{bail.locataire?.prenom} {bail.locataire?.nom}</div></div>
            <div className="space-y-1"><div className="text-slate-500">Unité</div><div className="font-medium">{bail.unite?.numero_unite || bail.unite?.reference || `#${bail.unite_id}`}</div></div>
            <div className="space-y-1"><div className="text-slate-500">Propriétaire</div><div className="font-medium">{bail.unite?.proprietaires?.map(p => p.nom_complet).join(', ') || '—'}</div></div>
            <div className="space-y-1"><div className="text-slate-500">Loyer total</div><div className="font-medium text-emerald-700">{bail.loyer_total} MAD</div></div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Formulaire de modification</CardTitle></CardHeader>
        <CardContent>
          <BailForm initialValue={bail} onSubmit={onSubmit} saving={saving} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Paiements mensuels</CardTitle></CardHeader>
        <CardContent>
          <BailPaymentsGrid bail={bail} />
        </CardContent>
      </Card>

      <BailChargesSquares bail={bail} />

      <BailChargesSummary bail={bail} />
    </div>
  );
}
