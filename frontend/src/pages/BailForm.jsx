import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import { useGetUnitesQuery } from '../features/unites/unitesApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import BailDocEditor from '../components/BailDocEditor';
import BailResiliationEditor from '../components/BailResiliationEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useGetBauxQuery } from '../api/baseApi';

const empty = {
  numero_bail: '',
  locataire_id: '',
  unite_id: '',
  date_debut: '',
  date_fin: '',
  duree: '',
  montant_loyer: '',
  charges: '',
  depot_garantie: '',
  mode_paiement: 'virement',
  renouvellement_auto: true,
  clause_particuliere: '',
  observations: '',
  statut: 'en_attente',
};

export default function BailForm({ initialValue, onSubmit, saving }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [locSearch, setLocSearch] = useState('');
  const [uniteSearch, setUniteSearch] = useState('');
  const editorRef = useRef(null);
  const [periodConflict, setPeriodConflict] = useState(null); // { message, bail } | null
  const [dateOrderError, setDateOrderError] = useState('');
  
  const [showResiliationModal, setShowResiliationModal] = useState(false);
  const [resiliationData, setResiliationData] = useState({});
  const resiliationEditorRef = useRef(null);

  // Fetch locataires and unités for selects
  // Use 'search' param consumed by hook (translates to ?q=)
  const { data: locData } = useGetLocatairesQuery({ search: locSearch, per_page: 50 });
  const locataires = locData?.data || locData || [];
  // Request only vacant (available) units; hook translates 'search' to ?q=
  const { data: uniteData } = useGetUnitesQuery({ search: uniteSearch, per_page: 50, statut: 'vacant' });
  const unites = uniteData?.data || uniteData || [];

  // Fetch existing baux for selected unit to check overlap
  const { data: bauxData } = useGetBauxQuery(
    form.unite_id ? { unite_id: form.unite_id, per_page: 100, sort_by: 'date_debut', sort_dir: 'desc' } : undefined,
    { skip: !form.unite_id }
  );
  const bauxUnite = bauxData?.data || bauxData || [];

  useEffect(() => {
    if (initialValue) {
      const data = { ...empty, ...initialValue };
      
      // Robust normalization for mode_paiement
      let mp = String(data.mode_paiement || '').toLowerCase().trim();
      // Handle variations/typos
      if (mp.includes('espece') || mp.includes('espéce') || mp.includes('espèces')) {
        data.mode_paiement = 'especes';
      } else if (mp.includes('cheque') || mp.includes('chèque')) {
        data.mode_paiement = 'cheque';
      } else if (mp.includes('virement')) {
        data.mode_paiement = 'virement';
      } else {
        // Default fallback if empty or unrecognized
        data.mode_paiement = 'virement';
      }

      setForm(data);

      if (initialValue.locataire_id) {
        const loc = locataires.find(l => l.id === Number(initialValue.locataire_id));
        setLocSearch(loc ? (loc.nom ? `${loc.nom} ${loc.prenom || ''}`.trim() : loc.raison_sociale || '') : '');
      }
      if (initialValue.unite_id) {
        const u = unites.find(u => u.id === Number(initialValue.unite_id));
        setUniteSearch(u ? (u.numero_unite || u.adresse_complete || '') : '');
      }
    }
  }, [initialValue]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Helper: compute duration in months between two dates
  const computeMonths = (startStr, endStr) => {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '';
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() >= start.getDate()) months += 1;
    return String(months > 0 ? months : '');
  };

  // Auto-calculate duration when both dates are set
  useEffect(() => {
    if (form.date_debut && form.date_fin) {
      const m = computeMonths(form.date_debut, form.date_fin);
      if ((form.duree || '') !== (m || '')) {
        setForm(f => ({ ...f, duree: m }));
      }
      const start = new Date(form.date_debut);
      const end = new Date(form.date_fin);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
        setDateOrderError('La date de fin doit être postérieure à la date de début.');
      } else {
        setDateOrderError('');
      }
    }
    // If date_fin is cleared, also clear duration
    if (form.date_debut && !form.date_fin && form.duree) {
      setForm(f => ({ ...f, duree: '' }));
    }
    if (form.date_debut && !form.date_fin) {
      setDateOrderError('');
    }
  }, [form.date_debut, form.date_fin]);

  // Check overlap with existing baux for the selected unit
  useEffect(() => {
    if (!form.unite_id || !form.date_debut) {
      setPeriodConflict(null);
      return;
    }
    // In edit mode: if dates are unchanged compared to the current bail, don't flag conflict
    if (initialValue?.id && String(initialValue.unite_id) === String(form.unite_id) &&
        initialValue.date_debut === form.date_debut && (initialValue.date_fin || '') === (form.date_fin || '')) {
      setPeriodConflict(null);
      return;
    }
    const start = new Date(form.date_debut);
    const end = form.date_fin ? new Date(form.date_fin) : null;
    const endTime = end ? end.getTime() : Number.POSITIVE_INFINITY;
    if (Number.isNaN(start.getTime())) {
      setPeriodConflict(null);
      return;
    }
    const conflicts = (Array.isArray(bauxUnite) ? bauxUnite : [])
      .filter(b => !initialValue?.id || String(b.id) !== String(initialValue.id))
      .filter(b => ['actif', 'en_attente'].includes(b.statut))
      .filter(b => {
        const bStart = b.date_debut ? new Date(b.date_debut) : null;
        const bEnd = b.date_fin ? new Date(b.date_fin) : null;
        if (!bStart) return false;
        const bStartTime = bStart.getTime();
        const bEndTime = bEnd ? bEnd.getTime() : Number.POSITIVE_INFINITY;
        return bStartTime <= endTime && (bEndTime >= start.getTime());
      });
    if (conflicts.length > 0) {
      const c = conflicts[0];
      const startStr = c.date_debut ? new Date(c.date_debut).toLocaleDateString() : '';
      const endStr = c.date_fin ? new Date(c.date_fin).toLocaleDateString() : '—';
      const msg = `Conflit: bail ${c.numero_bail || c.id} (${c.statut}) du ${startStr} au ${endStr}.`;
      setPeriodConflict({ message: msg, bail: c });
    } else {
      setPeriodConflict(null);
    }
  }, [form.unite_id, form.date_debut, form.date_fin, bauxUnite, initialValue?.id]);

  const handleResiliationConfirm = async () => {
    if (resiliationEditorRef.current) {
        const data = await resiliationEditorRef.current.getContent();
        setResiliationData(data);
        setShowResiliationModal(false);
        toast({ title: "Document de résiliation prêt à être enregistré." });
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.locataire_id) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un locataire valide dans la liste.' });
      return;
    }
    if (!form.unite_id) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner une unité valide dans la liste.' });
      return;
    }

    let docData = {};
    if (editorRef.current) {
        docData = await editorRef.current.getContent();
    }

    const payload = {
      numero_bail: form.numero_bail || undefined,
      locataire_id: form.locataire_id,
      unite_id: form.unite_id,
      date_debut: form.date_debut,
      date_fin: form.date_fin || undefined,
      duree: form.duree || undefined,
      montant_loyer: form.montant_loyer,
      charges: form.charges || 0,
      depot_garantie: form.depot_garantie || 0,
      mode_paiement: form.mode_paiement,
      renouvellement_auto: !!form.renouvellement_auto,
      clause_particuliere: form.clause_particuliere || undefined,
      observations: form.observations || undefined,
      statut: form.statut || undefined,
      ...docData,
      ...resiliationData
    };
    onSubmit && onSubmit(payload);
  };

  // Ensure selected options appear even if not in current page of results
  const mergedLocataires = useMemo(() => {
    if (!form.locataire_id) return locataires;
    const exists = Array.isArray(locataires) && locataires.some(l => String(l.id) === String(form.locataire_id));
    if (exists) return locataires;
    // If initialValue provided with nested locataire, include it
    const extra = initialValue?.locataire ? [initialValue.locataire] : [];
    return [...extra, ...(locataires || [])];
  }, [locataires, form.locataire_id, initialValue]);

  const mergedUnites = useMemo(() => {
    if (!form.unite_id) return unites;
    const exists = Array.isArray(unites) && unites.some(u => String(u.id) === String(form.unite_id));
    if (exists) return unites;
    const extra = initialValue?.unite ? [initialValue.unite] : [];
    return [...extra, ...(unites || [])];
  }, [unites, form.unite_id, initialValue]);

  const onSelectUnite = (uniteId) => {
    const id = uniteId ? Number(uniteId) : '';
    const u = (mergedUnites || []).find(x => String(x.id) === String(id));
    setForm(f => ({
      ...f,
      unite_id: id,
    }));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Section 1: Identification */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Identification du bail</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Numéro bail</Label>
              <Input value={form.numero_bail} onChange={e => onChange('numero_bail', e.target.value)} placeholder="Généré automatiquement" />
              <div className="text-xs text-slate-500">Laissez vide pour génération auto</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Locataire <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  list="locataires-list"
                  className="pl-8"
                  placeholder="Rechercher et sélectionner un locataire..."
                  value={form.locataire_id ? (() => {
                    const l = mergedLocataires?.find(l => String(l.id) === String(form.locataire_id));
                    if (!l) return '';
                    const isSociete = l.type_personne === 'societe' || (!l.type_personne && !!l.raison_sociale);
                    return isSociete ? (l.raison_sociale || '') : `${l.nom || ''} ${l.prenom || ''}`.trim();
                  })() : locSearch}
                  onChange={(e) => {
                    setLocSearch(e.target.value);
                    const match = mergedLocataires?.find(l => {
                      const isSociete = l.type_personne === 'societe' || (!l.type_personne && !!l.raison_sociale);
                      const name = isSociete ? (l.raison_sociale || '') : `${l.nom || ''} ${l.prenom || ''}`.trim();
                      return name === e.target.value;
                    });
                    if (match) onChange('locataire_id', match.id); else onChange('locataire_id', '');
                  }}
                  required
                />
                <datalist id="locataires-list">
                  {mergedLocataires?.map(l => {
                    const isSociete = l.type_personne === 'societe' || (!l.type_personne && !!l.raison_sociale);
                    const name = isSociete ? (l.raison_sociale || '') : `${l.nom || ''} ${l.prenom || ''}`.trim();
                    const identifier = isSociete ? (l.ice ? `ICE: ${l.ice}` : '') : (l.cin ? `CIN: ${l.cin}` : '');
                    return (
                      <option key={l.id} value={name}>
                        {identifier && `(${identifier})`}
                      </option>
                    );
                  })}
                </datalist>
              </div>
              {form.locataire_id && (() => {
                const l = mergedLocataires?.find(l => String(l.id) === String(form.locataire_id));
                if (!l) return null;
                const isSociete = l.type_personne === 'societe' || (!l.type_personne && !!l.raison_sociale);
                const name = isSociete ? (l.raison_sociale || '') : `${l.nom || ''} ${l.prenom || ''}`.trim();
                const identifier = isSociete ? (l.ice ? `ICE: ${l.ice}` : '') : (l.cin ? `CIN: ${l.cin}` : '');
                return (
                  <div className="text-xs text-indigo-700">
                    Sélectionné: {name} {identifier && `(${identifier})`}
                  </div>
                );
              })()}
              {locSearch && !form.locataire_id && (
                <div className="text-xs text-red-500">Veuillez sélectionner une option de la liste</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Unité <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  list="unites-list"
                  className="pl-8"
                  placeholder="Rechercher et sélectionner une unité..."
                  value={form.unite_id ? (mergedUnites?.find(u => String(u.id) === String(form.unite_id))?.reference || mergedUnites?.find(u => String(u.id) === String(form.unite_id))?.numero_unite || '') : uniteSearch}
                  onChange={(e) => {
                    setUniteSearch(e.target.value);
                    const match = mergedUnites?.find(u => {
                      const ref = u.reference || u.numero_unite || `#${u.id}`;
                      return ref === e.target.value;
                    });
                    if (match) onSelectUnite(match.id); else onSelectUnite('');
                  }}
                  required
                />
                <datalist id="unites-list">
                  {mergedUnites?.map(u => (
                    <option key={u.id} value={u.reference || u.numero_unite || `#${u.id}`}>
                      {u.adresse_complete && `${u.adresse_complete} - `}{u.type_unite} ({u.statut})
                    </option>
                  ))}
                </datalist>
              </div>
              {form.unite_id && (
                <div className="text-xs text-emerald-700">Sélectionné: {mergedUnites?.find(u => String(u.id) === String(form.unite_id))?.numero_unite}</div>
              )}
              {uniteSearch && !form.unite_id && (
                <div className="text-xs text-red-500">Veuillez sélectionner une option de la liste</div>
              )}
              <div className="text-xs text-slate-500">Seules les unités vacantes sont listées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit details panel */}
      {form.unite_id && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            {(() => {
              const u = (mergedUnites || []).find(x => String(x.id) === String(form.unite_id));
              if (!u) return null;
              const equip = Array.isArray(u.equipements) ? u.equipements : (typeof u.equipements === 'string' ? u.equipements.split(',').map(s => s.trim()).filter(Boolean) : []);
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1"><div className="text-slate-500">Type</div><div className="font-medium">{u.type_unite}</div></div>
                  <div className="space-y-1 md:col-span-2"><div className="text-slate-500">Adresse</div><div className="font-medium">{u.adresse_complete}</div></div>
                  <div className="space-y-1"><div className="text-slate-500">Superficie</div><div className="font-medium">{u.superficie_m2 ?? '—'} m²</div></div>
                  <div className="space-y-1"><div className="text-slate-500">Pièces / SDB</div><div className="font-medium">{u.nb_pieces ?? '—'} / {u.nb_sdb ?? '—'}</div></div>
                  {equip.length > 0 && (
                    <div className="md:col-span-4">
                      <div className="text-slate-500 mb-1">Équipements</div>
                      <div className="flex flex-wrap gap-2">
                        {equip.map((eq, idx) => (<span key={idx} className="px-2 py-1 text-xs rounded bg-white border">{eq}</span>))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Section 2: Période */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Période du bail</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date début <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.date_debut} onChange={e => onChange('date_debut', e.target.value)} required />
              {periodConflict && (
                <div className="text-xs text-red-600 mt-1">
                  {periodConflict.message} {periodConflict.bail?.id && (
                    <a href={`/baux/${periodConflict.bail.id}`} className="underline text-red-700" target="_blank" rel="noreferrer">Voir</a>
                  )}
                </div>
              )}
              {dateOrderError && (
                <div className="text-xs text-red-600 mt-1">{dateOrderError}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date fin</Label>
              <Input type="date" value={form.date_fin || ''} onChange={e => onChange('date_fin', e.target.value)} />
              <div className="text-xs text-slate-500">Optionnel si renouvellement auto</div>
              {periodConflict && (
                <div className="text-xs text-red-600 mt-1">
                  {periodConflict.message} {periodConflict.bail?.id && (
                    <a href={`/baux/${periodConflict.bail.id}`} className="underline text-red-700" target="_blank" rel="noreferrer">Voir</a>
                  )}
                </div>
              )}
              {dateOrderError && (
                <div className="text-xs text-red-600 mt-1">{dateOrderError}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Durée (mois)</Label>
              <Input
                type="number"
                onWheel={(e) => e.target.blur()}
                value={form.duree}
                onChange={e => onChange('duree', e.target.value)}
                placeholder="Ex: 12"
                readOnly={Boolean(form.date_debut && form.date_fin)}
              />
              {form.date_debut && form.date_fin && (
                <div className="text-xs text-slate-500">Calculé automatiquement à partir des dates</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Aspects financiers */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Aspects financiers</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Loyer mensuel <span className="text-red-500">*</span></Label>
              <div className="flex">
                <Input type="number" onWheel={(e) => e.target.blur()} step="0.01" value={form.montant_loyer} onChange={e => onChange('montant_loyer', e.target.value)} placeholder="0.00" className="rounded-r-none" required />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r bg-emerald-50 text-emerald-700">MAD</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Charges mensuelles</Label>
              <div className="flex">
                <Input type="number" onWheel={(e) => e.target.blur()} step="0.01" value={form.charges} onChange={e => onChange('charges', e.target.value)} placeholder="0.00" className="rounded-r-none" />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r bg-sky-50 text-sky-700">MAD</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dépôt de garantie</Label>
              <div className="flex">
                <Input type="number" onWheel={(e) => e.target.blur()} step="0.01" value={form.depot_garantie} onChange={e => onChange('depot_garantie', e.target.value)} placeholder="0.00" className="rounded-r-none" />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r bg-amber-50 text-amber-700">MAD</span>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Mode de paiement</Label>
              <Select 
                key={initialValue?.id || 'new'} 
                value={form.mode_paiement} 
                onValueChange={(v) => onChange('mode_paiement', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Renouvellement automatique</Label>
              <div className="flex items-center gap-2 border rounded p-2 bg-slate-50">
                <Checkbox id="renouv" checked={!!form.renouvellement_auto} onCheckedChange={(v) => onChange('renouvellement_auto', !!v)} />
                <Label htmlFor="renouv" className="text-xs cursor-pointer">{form.renouvellement_auto ? 'Activé' : 'Désactivé'}</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Clauses et observations */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Clauses et observations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Clause particulière</Label>
              <Textarea rows={3} value={form.clause_particuliere} onChange={e => onChange('clause_particuliere', e.target.value)} placeholder="Conditions ou clauses spécifiques du bail..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observations</Label>
              <Textarea rows={2} value={form.observations} onChange={e => onChange('observations', e.target.value)} placeholder="Remarques additionnelles..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Statut */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Statut du bail</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Statut</Label>
              <div className="flex gap-2">
                <Select value={form.statut} onValueChange={(v) => {
                  onChange('statut', v);
                  if (v === 'resilie') setShowResiliationModal(true);
                }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="resilie">Résilié</SelectItem>
                  </SelectContent>
                </Select>
                {form.statut === 'resilie' && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowResiliationModal(true)}>
                    Éditer Acte
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Editor (Only in Edit Mode) */}
      {initialValue?.id && (
        <div className="mt-6">
            <BailDocEditor ref={editorRef} bail={initialValue} />
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!!saving || !!periodConflict || !!dateOrderError} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          {saving ? 'Enregistrement...' : 'Enregistrer le bail'}
        </Button>
      </div>

      <Dialog open={showResiliationModal} onOpenChange={setShowResiliationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Acte de Résiliation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <BailResiliationEditor ref={resiliationEditorRef} bail={initialValue} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResiliationModal(false)}>Annuler</Button>
            <Button onClick={handleResiliationConfirm}>Confirmer et Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
