import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetAvenantQuery, useUpdateAvenantMutation, useGetMeQuery } from '../api/baseApi';
import { PERMS } from '../utils/permissionKeys';
import useAuthz from '../hooks/useAuthz';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSignature, Save, ArrowLeft, Download, RefreshCw, Upload } from 'lucide-react';

// Helper to format date from backend to YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function AvenantEditShadcn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuthz();
  const avenantState = location.state?.avenant;
  const { data, isFetching } = useGetAvenantQuery(id, { skip: !!avenantState });
  const { data: me } = useGetMeQuery();
  const [updateAvenant, { isLoading }] = useUpdateAvenantMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    const source = avenantState || data;
    if (source && !form) {
      setForm({
        mandat_id: source.mandat_id,
        reference: source.reference || '',
        date_pouvoir_initial: formatDateForInput(source.date_pouvoir_initial),
        objet_resume: source.objet_resume || '',
        modifs_text: source.modifs_text || '',
        date_effet: formatDateForInput(source.date_effet),
        lieu_signature: source.lieu_signature || '',
        date_signature: formatDateForInput(source.date_signature),
        rep_b_user_id: source.rep_b_user_id || me?.id || '',
        statut: source.statut || 'brouillon',
        fichier_url: source.fichier_url || '',
        created_by: source.created_by || '',
      });
    }
  }, [data, avenantState, form, me?.id]);

  if ((isFetching && !avenantState) || !form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSave = async (e) => {
    e.preventDefault();
    try {
      let payload = {
        ...form,
        mandat_id: Number(form.mandat_id),
        rep_b_user_id: form.rep_b_user_id ? Number(form.rep_b_user_id) : undefined,
        created_by: form.created_by ? Number(form.created_by) : undefined,
      };
      if (form.file) {
        payload.file = form.file; // handled in api layer -> mapped to 'fichier'
      }
      await updateAvenant({ id, payload }).unwrap();
      navigate('/avenants');
    } catch (err) {
      console.error(err);
      alert('Erreur de mise à jour de l\'avenant');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/avenants-mandat/${id}/docx`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avenant_${id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Impossible de télécharger le document de l'avenant.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/avenants')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileSignature className="h-8 w-8 text-amber-600" />
              Modifier l'avenant (SHADCN)
            </h1>
            <p className="text-slate-500">Référence: {form.reference || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadDocx} className="gap-2">
            <Download className="h-4 w-4" />
            Générer DOCX
          </Button>
          <Button onClick={onSave} disabled={isLoading} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne Gauche: Infos Principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails de l'avenant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Référence</Label>
                    <Input 
                      value={form.reference} 
                      onChange={e => onChange('reference', e.target.value)} 
                      placeholder="Ex: AV-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={form.statut} onValueChange={v => onChange('statut', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="applique">Appliqué</SelectItem>
                        <SelectItem value="annule">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Objet (Résumé)</Label>
                  <Input 
                    value={form.objet_resume} 
                    onChange={e => onChange('objet_resume', e.target.value)} 
                    placeholder="Ex: Modification des honoraires"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Modifications (Texte complet)</Label>
                  <Textarea 
                    value={form.modifs_text} 
                    onChange={e => onChange('modifs_text', e.target.value)} 
                    rows={8}
                    placeholder="Détail des modifications apportées au mandat..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fichier joint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form.fichier_url && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded border">
                      <FileSignature className="h-5 w-5 text-blue-500" />
                      <a href={form.fichier_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                        Voir le fichier actuel
                      </a>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Remplacer le fichier (PDF, DOCX...)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        onChange={e => onChange('file', e.target.files[0])} 
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne Droite: Dates & Signature */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dates & Effet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date d'effet</Label>
                  <Input 
                    type="date" 
                    value={form.date_effet} 
                    onChange={e => onChange('date_effet', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date pouvoir initial</Label>
                  <Input 
                    type="date" 
                    value={form.date_pouvoir_initial} 
                    onChange={e => onChange('date_pouvoir_initial', e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Lieu de signature</Label>
                  <Input 
                    value={form.lieu_signature} 
                    onChange={e => onChange('lieu_signature', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de signature</Label>
                  <Input 
                    type="date" 
                    value={form.date_signature} 
                    onChange={e => onChange('date_signature', e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
