import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReactSelect from 'react-select';
import { useCreateInterventionMutation, useUpdateInterventionMutation, useGetBauxQuery, useGetInterventionsQuery, useGetInterventionQuery, useGetInterventionNaturesQuery } from '../api/baseApi';
import { useGetPrestatairesQuery } from '../features/prestataires/prestatairesApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Wrench, Pencil, Plus, XCircle, CheckCircle } from 'lucide-react';

export default function InterventionCreate() {
  const { can } = useAuthz();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;
  const { data: bauxData } = useGetBauxQuery({ per_page: 1000, with: 'locataire,unite.proprietaires' });
  const baux = bauxData?.data || [];
  const { data: interventionsData } = useGetInterventionsQuery({ per_page: 1000 });
  const { data: naturesData } = useGetInterventionNaturesQuery();
  const naturesProblemes = naturesData || [];
  const { data: prestatairesData } = useGetPrestatairesQuery({ per_page: 1000 });
  const prestataires = prestatairesData?.data || [];
  const interventionFromState = location.state?.intervention;
  const [createInter, { isLoading: isCreating }] = useCreateInterventionMutation();
  const [updateInter, { isLoading: isUpdating }] = useUpdateInterventionMutation();

  const [form, setForm] = useState({
    bail_id: '', prestataire_id: '', reclamation_id: '',
    demandeur_nom_societe: '', demandeur_service: '', demandeur_telephone: '', demandeur_email: '',
    date_demande: '', urgence: 'normal', nature_probleme: '', localisation: '', symptomes: '', pieces_materiel: '', actions_effectuees: '', date_planifiee: '', status: 'ouvert', charge: ''
  });
  const [error, setError] = useState(null);
  const [selectedBail, setSelectedBail] = useState(null);
  const [isLocataireDemandeur, setIsLocataireDemandeur] = useState(false);

  // Options for ReactSelect
  const bauxOptions = useMemo(() => baux.map(b => {
    const locataireLabel = b.locataire?.type === 'personne' 
      ? `${b.locataire?.prenom || ''} ${b.locataire?.nom || ''}`.trim() 
      : b.locataire?.raison_sociale || '';
      
    const proprietaires = b.unite?.proprietaires || [];
    const proprietairesLabel = proprietaires.length > 0
      ? proprietaires.map(p => p.type === 'personne' ? `${p.prenom} ${p.nom}` : p.raison_sociale).join(', ')
      : 'Aucun propriétaire';

    return {
      value: String(b.id),
      label: `${(b.numero_bail || `#${b.id}`)} – Loc: ${locataireLabel} – Prop: ${proprietairesLabel}`
    };
  }), [baux]);

  const prestatairesOptions = useMemo(() => [
    { value: 'none', label: 'Aucun technicien assigné' },
    ...prestataires.map(p => ({
      value: String(p.id),
      label: `${(p.nom_raison || p.nom || 'Sans nom')}${p.domaine_activite ? ` - ${p.domaine_activite}` : ''}`
    }))
  ], [prestataires]);

  const urgenceOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'normal', label: 'Normal' },
    { value: 'planifie', label: 'Planifié' }
  ];

  const statusOptions = [
    { value: 'ouvert', label: 'Ouvert' },
    { value: 'planifie', label: 'Planifié' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'resolu', label: 'Résolu' },
    { value: 'ferme', label: 'Fermé' },
    { value: 'annule', label: 'Annulé' }
  ];

  if (isEdit) {
    if (!can(PERMS.interventions.update)) return <div className="p-6 text-red-500">Accès refusé</div>;
  } else {
    if (!can(PERMS.interventions.create)) return <div className="p-6 text-red-500">Accès refusé</div>;
  }

  const cachedIntervention = useMemo(() => {
    if (!isEdit) return null;
    if (interventionFromState) return interventionFromState;
    const list = interventionsData?.data || [];
    return list.find(i => i.id === parseInt(id));
  }, [isEdit, interventionFromState, interventionsData, id]);

  const shouldFetch = isEdit && !cachedIntervention;
  const { data: fetchedIntervention, isLoading: loadingFetched, isError: fetchError } = useGetInterventionQuery(id, { skip: !shouldFetch });
  const sourceIntervention = cachedIntervention || fetchedIntervention || null;

  const normalizeDate = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const str = String(val);
    return str.length >= 10 ? str.substring(0, 10) : str;
  };

  useEffect(() => {
    if (isEdit && sourceIntervention) {
      const i = sourceIntervention;
      setForm(f => ({
        ...f,
        bail_id: i.bail?.id ? String(i.bail.id) : (i.bail_id ? String(i.bail_id) : ''),
        prestataire_id: i.prestataire?.id ? String(i.prestataire.id) : (i.prestataire_id ? String(i.prestataire_id) : ''),
        reclamation_id: i.reclamation?.id ? String(i.reclamation.id) : (i.reclamation_id || ''),
        demandeur_nom_societe: i.demandeur_nom_societe || '',
        demandeur_service: i.demandeur_service || '',
        demandeur_telephone: i.demandeur_telephone || '',
        demandeur_email: i.demandeur_email || '',
        date_demande: normalizeDate(i.date_demande),
        urgence: i.urgence || 'normal',
        nature_probleme: i.nature_probleme || '',
        localisation: i.localisation || '',
        symptomes: i.symptomes || '',
        pieces_materiel: i.pieces_materiel || '',
        actions_effectuees: i.actions_effectuees || '',
        date_planifiee: normalizeDate(i.date_planifiee),
        status: i.status || 'ouvert',
        charge: i.charge || ''
      }));
    }
  }, [isEdit, sourceIntervention]);

  useEffect(() => {
    if (form.bail_id) {
      const bail = baux.find(b => String(b.id) === String(form.bail_id));
      setSelectedBail(bail || null);
    } else {
      setSelectedBail(null);
    }
  }, [form.bail_id, baux]);

  const handleBailChange = (bailId) => {
    const bail = baux.find(b => String(b.id) === String(bailId));
    setSelectedBail(bail || null);
    setForm(f => ({
      ...f,
      bail_id: bailId,
      demandeur_nom_societe: '',
      demandeur_telephone: '',
      demandeur_email: '',
      demandeur_service: bail?.unite?.reference || bail?.unite?.numero_unite || ''
    }));
    setIsLocataireDemandeur(false);
  };

  const handleLocataireDemandeurChange = (checked) => {
    setIsLocataireDemandeur(!!checked);
    if (checked && selectedBail?.locataire) {
      const loc = selectedBail.locataire;
      const nomComplet = loc.type === 'personne' ? `${loc.prenom || ''} ${loc.nom || ''}`.trim() : loc.raison_sociale || '';
      setForm(f => ({
        ...f,
        demandeur_nom_societe: nomComplet,
        demandeur_telephone: loc.telephone || '',
        demandeur_email: loc.email || '',
        // demandeur_service is already set by handleBailChange and should not be overwritten here unless necessary, 
        // but since it's read-only based on bail, we can keep it as is or re-affirm it.
        demandeur_service: selectedBail.unite?.reference || selectedBail.unite?.numero_unite || ''
      }));
    } else if (!checked) {
      setForm(f => ({
        ...f,
        demandeur_nom_societe: '',
        demandeur_telephone: '',
        demandeur_email: '',
        // Keep the service/unit info even if unchecked, as it relates to the bail, not just the locataire checkbox
        demandeur_service: selectedBail?.unite?.reference || selectedBail?.unite?.numero_unite || ''
      }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (!form.bail_id) { setError('Le bail est requis.'); return; }
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      if (isEdit) await updateInter({ id, payload }).unwrap(); else await createInter(payload).unwrap();
      navigate('/interventions');
    } catch (err) { setError(err?.data?.message || 'Erreur'); }
  };

  const getUrgenceBadge = (u) => {
    const cfg = {
      urgent: { cls: 'bg-red-500 text-white', label: 'Urgent' },
      normal: { cls: 'bg-blue-500 text-white', label: 'Normal' },
      planifie: { cls: 'bg-amber-500 text-white', label: 'Planifié' }
    }[u];
    return cfg ? <Badge className={`px-2 py-1 text-xs ${cfg.cls}`}>{cfg.label}</Badge> : null;
  };
  const getStatusBadge = (s) => {
    const cfg = {
      ouvert: { cls: 'bg-red-100 text-red-700', label: 'Ouvert' },
      planifie: { cls: 'bg-blue-100 text-blue-700', label: 'Planifié' },
      en_cours: { cls: 'bg-amber-100 text-amber-700', label: 'En cours' },
      resolu: { cls: 'bg-green-100 text-green-700', label: 'Résolu' },
      ferme: { cls: 'bg-slate-100 text-slate-700', label: 'Fermé' },
      annule: { cls: 'bg-slate-800 text-white', label: 'Annulé' }
    }[s];
    return cfg ? <Badge variant="outline" className={`px-2 py-1 text-xs border-0 ${cfg.cls}`}>{cfg.label}</Badge> : null;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-amber-100 text-amber-700">{isEdit ? <Pencil className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}</div>
            <h1 className="text-xl font-semibold text-slate-900">{isEdit ? 'Modifier intervention' : 'Nouvelle intervention'}</h1>
          </div>
          <p className="text-sm text-slate-500">{isEdit ? "Mettre à jour l'intervention" : "Créer une nouvelle intervention"}</p>
          <div className="flex gap-2 pt-1">
            {getUrgenceBadge(form.urgence)}
            {isEdit && getStatusBadge(form.status)}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/interventions')} className="gap-2" type="button"><XCircle className="h-4 w-4" /> Retour</Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <div className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded">{error}</div>}
        {isEdit && cachedIntervention && <div className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded">Chargé depuis cache.</div>}
        {isEdit && shouldFetch && loadingFetched && <div className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded">Chargement...</div>}
        {isEdit && shouldFetch && fetchError && <div className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded">Erreur de chargement.</div>}

        {/* Bail & Dates */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Bail & Dates</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bail *</Label>
              <ReactSelect
                options={bauxOptions}
                value={bauxOptions.find(opt => opt.value === form.bail_id) || null}
                onChange={(opt) => handleBailChange(opt ? opt.value : '')}
                placeholder="Sélectionner un bail..."
                isClearable
                menuPlacement="bottom"
                className="text-sm"
              />
              {selectedBail && <div className="text-xs text-green-600">Unité: {selectedBail.unite?.reference || selectedBail.unite?.numero_unite || '—'}</div>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Urgence</Label>
              <ReactSelect
                options={urgenceOptions}
                value={urgenceOptions.find(opt => opt.value === form.urgence)}
                onChange={(opt) => setForm(f => ({ ...f, urgence: opt ? opt.value : 'normal' }))}
                placeholder="Sélectionner urgence..."
                menuPlacement="bottom"
                className="text-sm"
              />
            </div>
            {isEdit && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Statut</Label>
                <ReactSelect
                  options={statusOptions}
                  value={statusOptions.find(opt => opt.value === form.status)}
                  onChange={(opt) => setForm(f => ({ ...f, status: opt ? opt.value : 'ouvert' }))}
                  placeholder="Sélectionner statut..."
                  menuPlacement="bottom"
                  className="text-sm"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date demande</Label>
              <Input type="date" value={form.date_demande} onChange={e => setForm(f => ({ ...f, date_demande: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date planifiée</Label>
              <Input type="date" value={form.date_planifiee} onChange={e => setForm(f => ({ ...f, date_planifiee: e.target.value }))} />
            </div>
            {selectedBail?.locataire && (
              <div className="md:col-span-2 flex items-start gap-3 rounded border p-3 bg-slate-50">
                <Checkbox id="locataireDemandeur" checked={isLocataireDemandeur} onCheckedChange={handleLocataireDemandeurChange} />
                <Label htmlFor="locataireDemandeur" className="text-xs cursor-pointer">
                  <span className="font-semibold">Le demandeur est le locataire du bail</span>
                  <div className="text-muted-foreground mt-1">{selectedBail.locataire.type === 'personne' ? `${selectedBail.locataire.prenom || ''} ${selectedBail.locataire.nom || ''}`.trim() : selectedBail.locataire.raison_sociale || ''}</div>
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affectation & Coût */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Affectation & Coût</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Technicien / Prestataire</Label>
              <ReactSelect
                options={prestatairesOptions}
                value={prestatairesOptions.find(opt => opt.value === (form.prestataire_id || 'none'))}
                onChange={(opt) => setForm(f => ({ ...f, prestataire_id: opt && opt.value !== 'none' ? opt.value : '' }))}
                placeholder="Sélectionner un technicien..."
                isClearable
                menuPlacement="bottom"
                className="text-sm"
              />
              {form.prestataire_id && <div className="text-xs text-green-600">Technicien assigné</div>}
              {!prestataires.length && <div className="text-xs text-amber-600">Aucun prestataire disponible</div>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Charge / Coût estimé (€)</Label>
              <Input type="number" step="0.01" value={form.charge} onChange={e => setForm(f => ({ ...f, charge: e.target.value }))} placeholder="0.00" />
            </div>
          </CardContent>
        </Card>

        {/* Demandeur */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Demandeur</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-xs font-semibold">Nom / Société {isLocataireDemandeur && form.bail_id && <span className="text-green-600">(locataire)</span>}</Label><Input value={form.demandeur_nom_societe} readOnly={isLocataireDemandeur && !!form.bail_id} onChange={e => setForm(f => ({ ...f, demandeur_nom_societe: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Service / Appartement / Bureau</Label><Input value={form.demandeur_service} readOnly={!!form.bail_id} onChange={e => setForm(f => ({ ...f, demandeur_service: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Téléphone {isLocataireDemandeur && form.bail_id && <span className="text-green-600">(locataire)</span>}</Label><Input value={form.demandeur_telephone} readOnly={isLocataireDemandeur && !!form.bail_id} onChange={e => setForm(f => ({ ...f, demandeur_telephone: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">E-mail {isLocataireDemandeur && form.bail_id && <span className="text-green-600">(locataire)</span>}</Label><Input type="email" value={form.demandeur_email} readOnly={isLocataireDemandeur && !!form.bail_id} onChange={e => setForm(f => ({ ...f, demandeur_email: e.target.value }))} /></div>
          </CardContent>
        </Card>

        {/* Description du problème */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Description du problème</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Nature du problème *</Label>
              <Input 
                value={form.nature_probleme} 
                onChange={e => setForm(f => ({ ...f, nature_probleme: e.target.value }))} 
                placeholder="Ex: Fuite d'eau, Panne électrique..." 
                list="natures-list"
              />
              <datalist id="natures-list">
                {naturesProblemes.map((nature, idx) => (
                  <option key={idx} value={nature} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Localisation précise</Label><Input value={form.localisation} onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Symptômes ou détails</Label><Textarea rows={3} value={form.symptomes} onChange={e => setForm(f => ({ ...f, symptomes: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Pièces ou matériel concernés</Label><Textarea rows={2} value={form.pieces_materiel} onChange={e => setForm(f => ({ ...f, pieces_materiel: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Actions déjà effectuées</Label><Textarea rows={2} value={form.actions_effectuees} onChange={e => setForm(f => ({ ...f, actions_effectuees: e.target.value }))} /></div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/interventions')} disabled={isCreating || isUpdating} className="gap-2"><XCircle className="h-4 w-4" /> Annuler</Button>
          <Button type="submit" disabled={isCreating || isUpdating} className="gap-2 bg-amber-600 hover:bg-amber-700">
            {isEdit ? (isUpdating ? <><span className="animate-pulse">⏳</span> Mise à jour...</> : <><CheckCircle className="h-4 w-4" /> Mettre à jour</>) : (isCreating ? <><span className="animate-pulse">⏳</span> Enregistrement...</> : <><Plus className="h-4 w-4" /> Créer</>)}
          </Button>
        </div>
      </form>
    </div>
  );
}
