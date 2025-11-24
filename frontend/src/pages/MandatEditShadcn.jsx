import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetMandatQuery, useUpdateMandatMutation } from '../api/baseApi';
import { PERMS } from '../utils/permissionKeys';
import useAuthz from '../hooks/useAuthz';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Save, ArrowLeft, Download, RefreshCw } from 'lucide-react';

// Helper to format date from backend to YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function MandatEditShadcn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuthz();
  const mandatState = location.state?.mandat;
  const { data, isFetching } = useGetMandatQuery(id, { skip: !!mandatState });
  const [updateMandat, { isLoading }] = useUpdateMandatMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    const source = mandatState || data;
    if (source && !form) {
      setForm({
        proprietaire_id: source.proprietaire_id,
        reference: source.reference || '',
        date_debut: formatDateForInput(source.date_debut),
        date_fin: formatDateForInput(source.date_fin),
        taux_gestion_pct: source.taux_gestion_pct ?? '',
        assiette_honoraires: source.assiette_honoraires || 'loyers_encaisse',
        tva_applicable: !!source.tva_applicable,
        tva_taux: source.tva_taux ?? '',
        frais_min_mensuel: source.frais_min_mensuel ?? '',
        periodicite_releve: source.periodicite_releve || 'mensuel',
        charge_maintenance: source.charge_maintenance || 'proprietaire',
        mode_versement: source.mode_versement || 'virement',
        description_bien: source.description_bien || '',
        usage_bien: source.usage_bien || 'habitation',
        pouvoirs_accordes: source.pouvoirs_accordes || '',
        lieu_signature: source.lieu_signature || '',
        date_signature: formatDateForInput(source.date_signature),
        langue: source.langue || 'fr',
        notes_clauses: source.notes_clauses || '',
        statut: source.statut || 'brouillon',
      });
    }
  }, [data, mandatState, form]);

  if ((isFetching && !mandatState) || !form) {
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
      const payload = {
        ...form,
        taux_gestion_pct: form.taux_gestion_pct === '' ? null : Number(form.taux_gestion_pct),
        tva_taux: form.tva_taux === '' ? null : Number(form.tva_taux),
        frais_min_mensuel: form.frais_min_mensuel === '' ? null : Number(form.frais_min_mensuel),
      };
      await updateMandat({ id, payload }).unwrap();
      navigate('/mandats');
    } catch (err) {
      console.error(err);
      alert('Erreur de mise à jour du mandat');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/mandats-gestion/${id}/docx`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mandat_${id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Impossible de télécharger le document du mandat.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/mandats')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Modifier le mandat (SHADCN)
            </h1>
            <p className="text-slate-500">Référence: {form.reference || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadDocx} className="gap-2">
            <Download className="h-4 w-4" />
            Générer DOCX
          </Button>
          <Button onClick={onSave} disabled={isLoading} className="gap-2 bg-blue-600 hover:bg-blue-700">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne Gauche: Infos Générales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Référence</Label>
                  <Input 
                    value={form.reference} 
                    onChange={e => onChange('reference', e.target.value)} 
                    placeholder="Ex: MANDAT-2024-001"
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
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                      <SelectItem value="resilie">Résilié</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input 
                    type="date" 
                    value={form.date_debut} 
                    onChange={e => onChange('date_debut', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input 
                    type="date" 
                    value={form.date_fin} 
                    onChange={e => onChange('date_fin', e.target.value)} 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description du bien</Label>
                  <Textarea 
                    value={form.description_bien} 
                    onChange={e => onChange('description_bien', e.target.value)} 
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usage du bien</Label>
                  <Select value={form.usage_bien} onValueChange={v => onChange('usage_bien', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="habitation">Habitation</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixte">Mixte</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conditions Financières</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taux de gestion (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={form.taux_gestion_pct} 
                    onChange={e => onChange('taux_gestion_pct', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frais minimum mensuel</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={form.frais_min_mensuel} 
                    onChange={e => onChange('frais_min_mensuel', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assiette honoraires</Label>
                  <Select value={form.assiette_honoraires} onValueChange={v => onChange('assiette_honoraires', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loyers_encaisse">Loyers encaissés</SelectItem>
                      <SelectItem value="loyers_charges_encaisse">Loyers + Charges encaissés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Périodicité relevé</Label>
                  <Select value={form.periodicite_releve} onValueChange={v => onChange('periodicite_releve', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="trimestriel">Trimestriel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox 
                    id="tva_applicable" 
                    checked={form.tva_applicable} 
                    onCheckedChange={checked => onChange('tva_applicable', checked)} 
                  />
                  <Label htmlFor="tva_applicable">TVA Applicable</Label>
                </div>
                {form.tva_applicable && (
                  <div className="space-y-2">
                    <Label>Taux TVA (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={form.tva_taux} 
                      onChange={e => onChange('tva_taux', e.target.value)} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne Droite: Détails Juridiques & Notes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signature & Juridique</CardTitle>
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
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select value={form.langue} onValueChange={v => onChange('langue', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ar">Arabe</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes & Clauses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pouvoirs accordés</Label>
                  <Textarea 
                    value={form.pouvoirs_accordes} 
                    onChange={e => onChange('pouvoirs_accordes', e.target.value)} 
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes / Clauses particulières</Label>
                  <Textarea 
                    value={form.notes_clauses} 
                    onChange={e => onChange('notes_clauses', e.target.value)} 
                    rows={4}
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
