import React, { useEffect, useState } from 'react';
import { useCreateMandatMutation, useCreateAvenantMutation, useUpdateMandatMutation, useGetMeQuery } from '../api/baseApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * ManualDocsWizard
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - proprietaires: array of owners available for selection
 *  - defaultProprietaireId: number | undefined
 *  - defaultDateDebut: string (yyyy-mm-dd, prefilled from UniteOwners)
 *  - defaultDateFin: string (yyyy-mm-dd, prefilled from UniteOwners)
 *  - uniteDescription: string (optional prefilled description)
 *  - allowAvenant: boolean (if user wants to optionally create avenant right after mandat)
 *  - lockCoreFields: boolean (if true, proprietaire and dates are prefilled and disabled)
 *  - defaultMandatId: number | undefined (prefill mandat_id for avenant)
 *  - unitOwners: array of { id, nom, parts } (optional, to display multiple owners)
 */
export default function ManualDocsWizard({ open, onClose, proprietaires, defaultProprietaireId, defaultDateDebut, defaultDateFin, uniteDescription, allowAvenant, lockCoreFields = false, initialMode, defaultMandatId, unitOwners = [], onBeforeSave, uniteId, editMandatId, requireAvenantFirst = false }) {
  const { data: me } = useGetMeQuery();
  const [createMandat, { isLoading: isSavingMandat }] = useCreateMandatMutation();
  const [updateMandat, { isLoading: isUpdatingMandat }] = useUpdateMandatMutation();
  const [createAvenant, { isLoading: isSavingAvenant }] = useCreateAvenantMutation();
  // step: 0 select mode, 1 mandat form, 2 avenant form, 3 done
  const [step, setStep] = useState(initialMode === 'mandat' ? 1 : initialMode === 'avenant' ? 2 : 0);
  const [mode, setMode] = useState(initialMode || 'both'); // 'mandat' | 'avenant' | 'both'
  const [mandat, setMandat] = useState({
    proprietaire_id: defaultProprietaireId || '',
    date_debut: defaultDateDebut || '',
    date_fin: defaultDateFin || '',
    assiette_honoraires: 'loyers_encaisse',
    taux_gestion_pct: '',
    tva_applicable: false,
    tva_taux: '',
    frais_min_mensuel: '',
    periodicite_releve: 'mensuel',
    charge_maintenance: 'proprietaire',
    mode_versement: 'virement',
    description_bien: uniteDescription || '',
    usage_bien: 'habitation',
    pouvoirs_accordes: '',
    lieu_signature: '',
    date_signature: '',
    langue: 'fr',
    notes_clauses: '',
    statut: 'brouillon',
  });

  const [avenant, setAvenant] = useState({
    mandat_id: defaultMandatId || null,
    reference: '',
    date_pouvoir_initial: '',
    objet_resume: '',
    modifs_text: '',
    date_effet: '',
    date_fin: '',
    lieu_signature: '',
    date_signature: '',
    rep_b_user_id: undefined,
    fichier_url: '',
    created_by: undefined,
    statut: 'brouillon'
  });

  const [errors, setErrors] = useState({});
  const [avenantErrors, setAvenantErrors] = useState({});
  const [createdMandat, setCreatedMandat] = useState(null);
  const [createdAvenant, setCreatedAvenant] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (me?.id) {
      setAvenant(a => ({ ...a, rep_b_user_id: me.id, created_by: me.id }));
    }
  }, [me]);

  // Keep mandat core fields in sync with owner flow and lock them
  useEffect(() => {
    setMandat(m => ({
      ...m,
      proprietaire_id: defaultProprietaireId || m.proprietaire_id,
      date_debut: defaultDateDebut || m.date_debut,
      date_fin: defaultDateFin || m.date_fin,
    }));
  }, [defaultProprietaireId, defaultDateDebut, defaultDateFin]);

  // Sync defaultMandatId to avenant
  useEffect(() => {
    if (defaultMandatId) {
      setAvenant(a => ({ ...a, mandat_id: defaultMandatId }));
    }
  }, [defaultMandatId]);

  // Ensure the wizard honors the desired initial mode each time it opens
  useEffect(() => {
    if (open) {
      const nextMode = initialMode || 'both';
      setMode(nextMode);
      setStep(nextMode === 'mandat' ? 1 : nextMode === 'avenant' ? 2 : 0);
      // When opening directly in avenant, ensure mandat_id is set
      if (nextMode === 'avenant' && defaultMandatId) {
        setAvenant(a => ({ ...a, mandat_id: defaultMandatId }));
      }
    }
  }, [open, initialMode, defaultMandatId]);

  // Prefill avenant dates from the selected period
  useEffect(() => {
    setAvenant(a => ({
      ...a,
      date_effet: defaultDateDebut || a.date_effet,
      date_fin: defaultDateFin || a.date_fin,
    }));
  }, [defaultDateDebut, defaultDateFin]);

  if (!open) return null;

  const validateMandat = () => {
    const e = {};
    // Seulement le propriétaire est obligatoire, tout le reste est optionnel
    if (!mandat.proprietaire_id) e.proprietaire_id = 'Choisir un propriétaire';
    if (!mandat.date_debut) e.date_debut = 'Date début requise';
    if (!mandat.date_fin) e.date_fin = 'Date fin requise';
    
    // Validation dates si elles sont présentes
    if (mandat.date_fin && mandat.date_debut && mandat.date_fin < mandat.date_debut) {
      e.date_fin = 'Date fin doit être >= date début';
    }
    return e;
  };
  
  const validateAvenant = () => {
    const e = {};
    // Seulement mandat_id obligatoire, tout le reste optionnel
    if (!avenant.mandat_id) e.mandat_id = 'Mandat requis';
    return e;
  };

  const saveMandat = async () => {
    const e = validateMandat();
    setErrors(e);
    setSubmitError(null);
    if (Object.keys(e).length) return;
    try {
      // In some flows we must not execute ownership changes before an avenant is created.
      // When requireAvenantFirst is true, skip onBeforeSave here and run it after avenant creation.
      if (!requireAvenantFirst && onBeforeSave) {
        await onBeforeSave();
      }

      const payload = {
        ...mandat,
        unite_id: uniteId ? Number(uniteId) : undefined,
        proprietaire_id: Number(mandat.proprietaire_id),
        taux_gestion_pct: mandat.taux_gestion_pct ? Number(mandat.taux_gestion_pct) : null,
        tva_taux: mandat.tva_taux ? Number(mandat.tva_taux) : null,
        frais_min_mensuel: mandat.frais_min_mensuel ? Number(mandat.frais_min_mensuel) : null,
      };
      // Ensure reference is autogenerated by backend: do not send empty reference
      delete payload.reference;
      // Determine if we should update instead of create
      const effectiveUpdateId = (editMandatId ?? defaultMandatId) ? Number(editMandatId ?? defaultMandatId) : null;
      let res;
      if (effectiveUpdateId) {
        // Update existing mandat instead of creating
        res = await updateMandat({ id: effectiveUpdateId, payload: {
          unite_id: uniteId ? Number(uniteId) : undefined,
          date_debut: payload.date_debut,
          date_fin: payload.date_fin,
          proprietaire_id: payload.proprietaire_id,
          taux_gestion_pct: payload.taux_gestion_pct,
          tva_applicable: payload.tva_applicable,
          tva_taux: payload.tva_taux,
          frais_min_mensuel: payload.frais_min_mensuel,
          periodicite_releve: payload.periodicite_releve,
          charge_maintenance: payload.charge_maintenance,
          mode_versement: payload.mode_versement,
          description_bien: payload.description_bien,
          usage_bien: payload.usage_bien,
          pouvoirs_accordes: payload.pouvoirs_accordes,
          lieu_signature: payload.lieu_signature,
          date_signature: payload.date_signature,
          langue: payload.langue,
          notes_clauses: payload.notes_clauses,
          assiette_honoraires: payload.assiette_honoraires,
          statut: payload.statut,
        }}).unwrap();
      } else {
        res = await createMandat(payload).unwrap();
      }
      setCreatedMandat(res);
      setAvenant(a => ({ ...a, mandat_id: (res?.id || defaultMandatId || editMandatId || a.mandat_id) }));
      if (!effectiveUpdateId && mode === 'both' && allowAvenant) setStep(2);
      else setStep(3);
    } catch (err) {
      console.error(err);
      setSubmitError('Erreur mandat: ' + (err?.data?.message || err?.message || 'Serveur'));
    }
  };

  const saveAvenant = async () => {
    const e = validateAvenant();
    setAvenantErrors(e);
    if (Object.keys(e).length) return;
    try {
      let payload = {
        ...avenant,
        mandat_id: Number(avenant.mandat_id),
        rep_b_user_id: Number(avenant.rep_b_user_id),
        created_by: avenant.created_by ? Number(avenant.created_by) : undefined
      };
      if (avenant.file) {
        payload.file = avenant.file;
      }
      // Include date_fin if provided (ignored by backend if unsupported)
      if (!payload.date_fin) delete payload.date_fin;
      const res = await createAvenant(payload).unwrap();
      setCreatedAvenant(res);
      
      // Trigger onBeforeSave only after avenant is successfully created
      if (onBeforeSave) {
        await onBeforeSave();
      }

      setStep(3);
    } catch (err) {
      console.error(err);
      setSubmitError('Erreur création avenant: ' + (err?.data?.message || err?.message || 'Serveur'));
    }
  };

  const closeAndReset = () => {
    const isSuccess = step === 3;
    setStep(initialMode === 'mandat' ? 1 : initialMode === 'avenant' ? 2 : 0);
    setMode(initialMode || 'both');
    setCreatedMandat(null);
    setCreatedAvenant(null);
    setErrors({});
    setAvenantErrors({});
    onClose(isSuccess);
  };

  const chooseStep = (
    <div className="p-4 md:p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mandat uniquement */}
        <Card 
          className={cn("cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", mode === 'mandat' ? 'border-blue-500 ring-2 ring-blue-200' : '')}
          style={{ background: mode === 'mandat' ? 'linear-gradient(135deg, #dbeafe, #e0e7ff)' : '#ffffff' }}
          onClick={() => setMode('mandat')}
        >
          <CardContent className="text-center p-6">
            <div className="flex justify-center mb-3">
              <input type="radio" className="h-6 w-6 cursor-pointer" checked={mode === 'mandat'} onChange={() => setMode('mandat')} />
            </div>
            <div className="p-3 rounded-lg inline-flex mb-3" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <i className="bi bi-file-text text-4xl text-blue-500"></i>
            </div>
            <div className="font-bold mb-2 text-slate-800">Mandat uniquement</div>
            <small className="text-muted-foreground block">Créer un nouveau mandat de gestion</small>
          </CardContent>
        </Card>
        
        {/* Avenant uniquement */}
        <Card 
          className={cn("cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", mode === 'avenant' ? 'border-amber-500 ring-2 ring-amber-200' : '')}
          style={{ background: mode === 'avenant' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#ffffff' }}
          onClick={() => setMode('avenant')}
        >
          <CardContent className="text-center p-6">
            <div className="flex justify-center mb-3">
              <input type="radio" className="h-6 w-6 cursor-pointer" checked={mode === 'avenant'} onChange={() => setMode('avenant')} />
            </div>
            <div className="p-3 rounded-lg inline-flex mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <i className="bi bi-file-earmark-plus text-4xl text-amber-500"></i>
            </div>
            <div className="font-bold mb-2 text-slate-800">Avenant uniquement</div>
            <small className="text-muted-foreground block">Créer un avenant pour un mandat existant</small>
          </CardContent>
        </Card>
        
        {/* Les deux */}
        <Card 
          className={cn("cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", mode === 'both' ? 'border-emerald-500 ring-2 ring-emerald-200' : '')}
          style={{ background: mode === 'both' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : '#ffffff' }}
          onClick={() => setMode('both')}
        >
          <CardContent className="text-center p-6">
            <div className="flex justify-center mb-3">
              <input type="radio" className="h-6 w-6 cursor-pointer" checked={mode === 'both'} onChange={() => setMode('both')} />
            </div>
            <div className="p-3 rounded-lg inline-flex mb-3" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <i className="bi bi-files text-4xl text-emerald-500"></i>
            </div>
            <div className="font-bold mb-2 text-slate-800">Les deux</div>
            <small className="text-muted-foreground block">Mandat et avenant en une seule étape</small>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end mt-6 gap-2">
        <Button 
          className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
          onClick={() => setStep(mode === 'avenant' ? 2 : 1)}
        >
          Continuer <i className="bi bi-arrow-right"></i>
        </Button>
      </div>
    </div>
  );

  const mandatForm = (
    <div className="p-4 md:p-6 bg-slate-50">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center rounded-lg w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600">
            <i className="bi bi-file-text text-2xl text-white"></i>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-lg">{editMandatId ? 'Modifier le mandat de gestion' : 'Nouveau Mandat de gestion'}</h5>
            <p className="text-muted-foreground text-sm">{editMandatId ? 'Mettez à jour les informations du mandat' : 'Remplissez les informations du mandat'}</p>
          </div>
        </div>
      </div>

      {/* Section: Informations principales */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-indigo-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-blue-100">
              <i className="bi bi-person-circle text-blue-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Propriétaire et période</h6>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              {unitOwners.length > 0 ? (
                <div className="mb-4">
                  <Label className="mb-2 block text-slate-700">Propriétaires (Indivision)</Label>
                  <div className="bg-slate-50 rounded-md border p-2 space-y-1 mb-2">
                    {unitOwners.map((o, i) => (
                      <div key={i} className="flex justify-between text-sm items-center p-1 hover:bg-slate-100 rounded">
                        <span className="font-medium text-slate-700">{o.nom}</span>
                        <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{o.parts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <Label className="mb-2 block text-slate-700">Propriétaire <span className="text-red-500">*</span></Label>
                  <Select 
                    value={String(mandat.proprietaire_id)} 
                    onValueChange={val => setMandat(m => ({ ...m, proprietaire_id: val }))}
                    disabled={lockCoreFields && !!mandat.proprietaire_id}
                  >
                    <SelectTrigger className={cn(errors.proprietaire_id ? "border-red-500" : "")}>
                      <SelectValue placeholder="Sélectionner un propriétaire..." />
                    </SelectTrigger>
                    <SelectContent>
                      {proprietaires.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nom_raison || p.email || `#${p.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.proprietaire_id && <div className="text-red-500 text-xs mt-1">{errors.proprietaire_id}</div>}
                  {lockCoreFields && mandat.proprietaire_id && (
                    <div className="text-sky-500 text-xs mt-1 flex items-center gap-1">
                      <i className="bi bi-lock-fill"></i> Défini par la répartition de l'unité
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-1">
              <div>
                <Label className="mb-2 block text-slate-700">Date début <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={mandat.date_debut} 
                  onChange={e => setMandat(m => ({ ...m, date_debut: e.target.value }))} 
                  disabled={lockCoreFields}
                  className={cn(errors.date_debut ? "border-red-500" : "")}
                />
                {errors.date_debut && <div className="text-red-500 text-xs mt-1">{errors.date_debut}</div>}
              </div>
              <div>
                <Label className="mb-2 block text-slate-700">Date fin <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={mandat.date_fin} 
                  onChange={e => setMandat(m => ({ ...m, date_fin: e.target.value }))} 
                  disabled={lockCoreFields}
                  className={cn(errors.date_fin ? "border-red-500" : "")}
                />
                {errors.date_fin && <div className="text-red-500 text-xs mt-1">{errors.date_fin}</div>}
              </div>
              <div className="col-span-2">
                <Label className="mb-2 block text-slate-700">Statut</Label>
                <Select value={mandat.statut} onValueChange={val => setMandat(m => ({ ...m, statut: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">📝 Brouillon</SelectItem>
                    <SelectItem value="en_validation">⏳ En validation</SelectItem>
                    <SelectItem value="signe">✅ Signé</SelectItem>
                    <SelectItem value="actif">🟢 Actif</SelectItem>
                    <SelectItem value="resilie">🔴 Résilié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Honoraires */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-emerald-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-emerald-100">
              <i className="bi bi-cash-coin text-emerald-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Honoraires et gestion</h6>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block text-slate-700">Taux de gestion (%)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.01" 
                  value={mandat.taux_gestion_pct} 
                  onChange={e => setMandat(m => ({ ...m, taux_gestion_pct: e.target.value }))} 
                  placeholder="0.00"
                  className="pr-8"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Langue</Label>
              <Select value={mandat.langue} onValueChange={val => setMandat(m => ({ ...m, langue: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="ar">🇲🇦 Arabe</SelectItem>
                  <SelectItem value="ar_fr">🇲🇦🇫🇷 Ar + Fr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Statut</Label>
              <Select value={mandat.statut} onValueChange={val => setMandat(m => ({ ...m, statut: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">📝 Brouillon</SelectItem>
                  <SelectItem value="en_validation">⏳ En validation</SelectItem>
                  <SelectItem value="signe">✅ Signé</SelectItem>
                  <SelectItem value="actif">🟢 Actif</SelectItem>
                  <SelectItem value="resilie">🔴 Résilié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Description */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-amber-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-amber-100">
              <i className="bi bi-file-earmark-text text-amber-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Description et clauses</h6>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-slate-700">Description du bien</Label>
              <Textarea 
                rows={2} 
                value={mandat.description_bien} 
                onChange={e => setMandat(m => ({ ...m, description_bien: e.target.value }))} 
                placeholder="Décrire le bien géré..."
              />
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Pouvoirs accordés / Texte</Label>
              <Textarea 
                rows={3} 
                value={mandat.pouvoirs_accordes} 
                onChange={e => setMandat(m => ({ ...m, pouvoirs_accordes: e.target.value }))} 
                placeholder="Détailler les pouvoirs accordés au gestionnaire..."
              />
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Clauses / Notes additionnelles</Label>
              <Textarea 
                rows={2} 
                value={mandat.notes_clauses} 
                onChange={e => setMandat(m => ({ ...m, notes_clauses: e.target.value }))} 
                placeholder="Notes ou clauses particulières..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Signature */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-purple-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-purple-100">
              <i className="bi bi-pen text-purple-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Signature</h6>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block text-slate-700">Date de signature</Label>
              <Input 
                type="date" 
                value={mandat.date_signature} 
                onChange={e => setMandat(m => ({ ...m, date_signature: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Lieu de signature</Label>
              <Input 
                type="text" 
                value={mandat.lieu_signature} 
                onChange={e => setMandat(m => ({ ...m, lieu_signature: e.target.value }))} 
                placeholder="Ville ou lieu..."
              />
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Fichier URL (optionnel)</Label>
              <Input 
                type="text" 
                value={mandat.fichier_url} 
                onChange={e => setMandat(m => ({ ...m, fichier_url: e.target.value }))} 
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {submitError}
        </div>
      )}

      <div className="flex justify-between mt-6 gap-3">
        <Button 
          variant="outline"
          onClick={() => {
            if (initialMode) {
              // When opened directly in mandat mode, treat left button as cancel/close
              onClose(false);
            } else {
              setStep(0);
            }
          }}
          disabled={isSavingMandat}
          className="gap-2"
        >
          <i className="bi bi-arrow-left"></i> {initialMode ? 'Annuler' : 'Précédent'}
        </Button>
        <Button 
          onClick={saveMandat}
          disabled={isSavingMandat}
          className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
        >
          {isSavingMandat ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
              {editMandatId ? 'Enregistrement...' : 'Création...'}
            </>
          ) : (
            <>
              <i className="bi bi-check-circle"></i> {editMandatId ? 'Modifier le mandat' : 'Créer le mandat'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const avenantForm = (
    <div className="p-4 md:p-6 bg-slate-50">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center rounded-lg w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600">
            <i className="bi bi-file-earmark-plus text-2xl text-white"></i>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-lg">Nouvel Avenant</h5>
            <p className="text-muted-foreground text-sm">Remplissez les informations de l'avenant</p>
          </div>
        </div>
      </div>

      {/* Section: Identification */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-indigo-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-blue-100">
              <i className="bi bi-hash text-blue-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Identification</h6>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!createdMandat && (
              <div>
                <Label className="mb-2 block text-slate-700">ID Mandat <span className="text-red-500">*</span></Label>
                <Input 
                  type="number" 
                  value={avenant.mandat_id || ''} 
                  onChange={e => setAvenant(a => ({ ...a, mandat_id: e.target.value }))} 
                  placeholder="Ex: 123"
                  disabled={!!defaultMandatId}
                  className={cn(avenantErrors.mandat_id ? "border-red-500" : "", defaultMandatId ? "bg-slate-100" : "")}
                />
                {avenantErrors.mandat_id && <div className="text-red-500 text-xs mt-1">{avenantErrors.mandat_id}</div>}
              </div>
            )}
            {!defaultMandatId && (
              <div>
                <Label className="mb-2 block text-slate-700">Référence</Label>
                <Input 
                  type="text" 
                  value={avenant.reference} 
                  onChange={e => setAvenant(a => ({ ...a, reference: e.target.value }))} 
                  placeholder="AV-2024-..."
                />
              </div>
            )}
            <div>
              <Label className="mb-2 block text-slate-700">Statut</Label>
              <Select value={avenant.statut} onValueChange={val => setAvenant(a => ({ ...a, statut: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">📝 Brouillon</SelectItem>
                  <SelectItem value="en_validation">⏳ En validation</SelectItem>
                  <SelectItem value="signe">✅ Signé</SelectItem>
                  <SelectItem value="actif">🟢 Actif</SelectItem>
                  <SelectItem value="resilie">🔴 Résilié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Dates et objet */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-emerald-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-emerald-100">
              <i className="bi bi-calendar-range text-emerald-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Dates et objet</h6>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block text-slate-700">Date pouvoir initial</Label>
              <Input 
                type="date" 
                value={avenant.date_pouvoir_initial || ''} 
                onChange={e => setAvenant(a => ({ ...a, date_pouvoir_initial: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Date début</Label>
              <Input 
                type="date" 
                value={avenant.date_effet} 
                onChange={e => setAvenant(a => ({ ...a, date_effet: e.target.value }))}
                disabled={lockCoreFields}
                className={cn(avenantErrors.date_effet ? "border-red-500" : "")}
              />
              {avenantErrors.date_effet && <div className="text-red-500 text-xs mt-1">{avenantErrors.date_effet}</div>}
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Date fin</Label>
              <Input 
                type="date" 
                value={avenant.date_fin || ''} 
                onChange={e => setAvenant(a => ({ ...a, date_fin: e.target.value }))}
                disabled={lockCoreFields}
              />
            </div>
            <div>
              <Label className="mb-2 block text-slate-700">Date de signature</Label>
              <Input 
                type="date" 
                value={avenant.date_signature || ''} 
                onChange={e => setAvenant(a => ({ ...a, date_signature: e.target.value }))}
              />
            </div>
            <div className="md:col-span-3">
              <Label className="mb-2 block text-slate-700">Objet / Résumé</Label>
              <Input 
                type="text" 
                value={avenant.objet_resume} 
                onChange={e => setAvenant(a => ({ ...a, objet_resume: e.target.value }))} 
                placeholder="Bref résumé de l'objet de l'avenant..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Modifications */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-amber-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-amber-100">
              <i className="bi bi-pencil-square text-amber-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Modifications et texte</h6>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-slate-700">Modifications / Texte détaillé</Label>
              <Textarea 
                rows={4} 
                value={avenant.modifs_text} 
                onChange={e => setAvenant(a => ({ ...a, modifs_text: e.target.value }))} 
                placeholder="Détailler les modifications apportées par cet avenant..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Signature et fichier */}
      <Card className="border-0 shadow-sm mb-6 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-purple-100">
            <div className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-purple-100">
              <i className="bi bi-pen text-purple-500"></i>
            </div>
            <h6 className="font-bold text-slate-800">Signature et fichier</h6>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block text-slate-700">Lieu de signature</Label>
              <Input 
                type="text" 
                value={avenant.lieu_signature} 
                onChange={e => setAvenant(a => ({ ...a, lieu_signature: e.target.value }))} 
                placeholder="Ville ou lieu..."
              />
            </div>
            <div className="md:col-span-3">
              <Label className="mb-2 block text-slate-700">Fichier (upload)</Label>
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  setAvenant(a => ({ ...a, file }));
                }}
                className="cursor-pointer"
              />
              {avenant.fichier_url && (
                <div className="mt-2 py-2 px-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-800">
                  <i className="bi bi-file-earmark-check text-blue-500"></i>
                  <span>Fichier actuel: <a href={avenant.fichier_url} target="_blank" rel="noreferrer" className="font-semibold underline hover:text-blue-900">ouvrir</a></span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {submitError}
        </div>
      )}

      <div className="flex justify-between mt-6 gap-3">
        <Button 
          variant="outline"
          onClick={() => {
            if (initialMode === 'avenant') {
              onClose(false);
            } else {
              setStep(mode === 'both' && createdMandat ? 3 : 0);
            }
          }}
          disabled={isSavingAvenant}
          className="gap-2"
        >
          <i className="bi bi-arrow-left"></i> {initialMode === 'avenant' ? 'Annuler' : 'Précédent'}
        </Button>
        <Button 
          onClick={saveAvenant}
          disabled={isSavingAvenant}
          className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
        >
          {isSavingAvenant ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
              Création...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle"></i> Créer l'avenant
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const doneView = (
    <div className="text-center py-12 px-4">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center rounded-full w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 mb-4">
          <i className="bi bi-check-circle-fill text-5xl text-emerald-500"></i>
        </div>
        <h4 className="font-bold text-2xl text-slate-800 mb-2">Création terminée avec succès !</h4>
        <p className="text-muted-foreground">Vos documents ont été créés et enregistrés</p>
      </div>
      <div className="mb-8 flex flex-col items-center gap-4">
        {createdMandat && (
          <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm min-w-[300px]">
            <div className="p-2 rounded-full bg-blue-100 mr-4">
              <i className="bi bi-file-text text-2xl text-blue-500"></i>
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Mandat de gestion</div>
              <small className="text-slate-500">Document #{createdMandat.id} créé</small>
            </div>
          </div>
        )}
        {createdAvenant && (
          <div className="flex items-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-sm min-w-[300px]">
            <div className="p-2 rounded-full bg-amber-100 mr-4">
              <i className="bi bi-file-earmark-plus text-2xl text-amber-500"></i>
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Avenant au mandat</div>
              <small className="text-slate-500">Document #{createdAvenant.id} créé</small>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-2">
        <Button 
          onClick={closeAndReset}
          className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md px-6"
        >
          <i className="bi bi-check-lg"></i> Terminer
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={closeAndReset}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 border-b border-slate-200">
          <div className="w-full">
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-4">
              {initialMode ? <div className="flex-grow"></div> : (
              <div className="flex items-center gap-2 flex-grow">
                {/* Step 1 */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "rounded-full flex items-center justify-center w-11 h-11 text-base font-bold transition-all duration-300",
                    step >= 0 ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-200 text-slate-400"
                  )}>
                    {step > 0 ? <i className="bi bi-check-lg"></i> : '1'}
                  </div>
                  <div className="hidden md:block">
                    <div className={cn("text-xs font-bold", step >= 0 ? "text-slate-800" : "text-slate-400")}>
                      Étape 1
                    </div>
                    <div className={cn("text-sm font-semibold", step >= 0 ? "text-blue-600" : "text-slate-400")}>
                      Type
                    </div>
                  </div>
                </div>
                
                {/* Connector */}
                <div className={cn(
                  "flex-grow mx-2 h-1 rounded-full min-w-[30px] max-w-[100px] transition-all duration-300",
                  step >= 1 ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-slate-200"
                )}></div>
                
                {/* Step 2 */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "rounded-full flex items-center justify-center w-11 h-11 text-base font-bold transition-all duration-300",
                    step >= 1 ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-200 text-slate-400"
                  )}>
                    {step > 1 ? <i className="bi bi-check-lg"></i> : '2'}
                  </div>
                  <div className="hidden md:block">
                    <div className={cn("text-xs font-bold", step >= 1 ? "text-slate-800" : "text-slate-400")}>
                      Étape 2
                    </div>
                    <div className={cn("text-sm font-semibold", step >= 1 ? "text-blue-600" : "text-slate-400")}>
                      Informations
                    </div>
                  </div>
                </div>
                
                {/* Connector */}
                <div className={cn(
                  "flex-grow mx-2 h-1 rounded-full min-w-[30px] max-w-[100px] transition-all duration-300",
                  step >= 3 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-slate-200"
                )}></div>
                
                {/* Step 3 */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "rounded-full flex items-center justify-center w-11 h-11 text-base font-bold transition-all duration-300",
                    step >= 3 ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-200 text-slate-400"
                  )}>
                    {step >= 3 ? <i className="bi bi-check-lg"></i> : '3'}
                  </div>
                  <div className="hidden md:block">
                    <div className={cn("text-xs font-bold", step >= 3 ? "text-slate-800" : "text-slate-400")}>
                      Étape 3
                    </div>
                    <div className={cn("text-sm font-semibold", step >= 3 ? "text-emerald-600" : "text-slate-400")}>
                      Terminé
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
            <DialogTitle className="font-bold text-slate-800 text-xl">
              {step === 0 && 'Assistant de création de documents'}
              {step === 1 && (editMandatId ? 'Modifier le mandat' : 'Mandat de gestion')}
              {step === 2 && 'Avenant au mandat'}
              {step === 3 && 'Finalisation'}
            </DialogTitle>
          </div>
        </div>
        <div className="bg-white overflow-y-auto flex-grow">
          {step === 0 && chooseStep}
          {step === 1 && mandatForm}
          {step === 2 && avenantForm}
          {step === 3 && doneView}
        </div>
      </DialogContent>
    </Dialog>
  );
}
