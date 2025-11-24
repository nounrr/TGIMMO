import React, { useEffect, useMemo, useState } from 'react';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import { useGetUnitesQuery } from '../features/unites/unitesApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

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
  const [form, setForm] = useState(empty);
  const [locSearch, setLocSearch] = useState('');
  const [uniteSearch, setUniteSearch] = useState('');

  // Fetch locataires and unités for selects
  // Use 'search' param consumed by hook (translates to ?q=)
  const { data: locData } = useGetLocatairesQuery({ search: locSearch, per_page: 50 });
  const locataires = locData?.data || locData || [];
  // Request only vacant (available) units; hook translates 'search' to ?q=
  const { data: uniteData } = useGetUnitesQuery({ search: uniteSearch, per_page: 50, statut: 'vacant' });
  const unites = uniteData?.data || uniteData || [];

  useEffect(() => {
    if (initialValue) {
      setForm({ ...empty, ...initialValue });
    }
  }, [initialValue]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
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
                  value={form.locataire_id ? (mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.prenom ? `${mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.prenom} ${mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.nom || ''}`.trim() : (mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.raison_sociale || '')) : locSearch}
                  onChange={(e) => {
                    setLocSearch(e.target.value);
                    const match = mergedLocataires?.find(l => {
                      const name = l.prenom ? `${l.prenom} ${l.nom || ''}`.trim() : (l.raison_sociale || l.email || `#${l.id}`);
                      return name === e.target.value;
                    });
                    if (match) onChange('locataire_id', match.id); else if (!e.target.value) onChange('locataire_id', '');
                  }}
                  required
                />
                <datalist id="locataires-list">
                  {mergedLocataires?.map(l => (
                    <option key={l.id} value={l.prenom ? `${l.prenom} ${l.nom || ''}`.trim() : (l.raison_sociale || l.email || `#${l.id}`)}>
                      {l.email && `(${l.email})`}
                    </option>
                  ))}
                </datalist>
              </div>
              {form.locataire_id && (
                <div className="text-xs text-indigo-700">Sélectionné: {mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.prenom} {mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.nom}</div>
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
                    if (match) onSelectUnite(match.id); else if (!e.target.value) onSelectUnite('');
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
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date fin</Label>
              <Input type="date" value={form.date_fin || ''} onChange={e => onChange('date_fin', e.target.value)} />
              <div className="text-xs text-slate-500">Optionnel si renouvellement auto</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Durée (mois)</Label>
              <Input type="number" value={form.duree} onChange={e => onChange('duree', e.target.value)} placeholder="Ex: 12" />
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
                <Input type="number" step="0.01" value={form.montant_loyer} onChange={e => onChange('montant_loyer', e.target.value)} placeholder="0.00" className="rounded-r-none" required />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r bg-emerald-50 text-emerald-700">MAD</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Charges mensuelles</Label>
              <div className="flex">
                <Input type="number" step="0.01" value={form.charges} onChange={e => onChange('charges', e.target.value)} placeholder="0.00" className="rounded-r-none" />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r bg-sky-50 text-sky-700">MAD</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dépôt de garantie</Label>
              <div className="flex">
                <Input type="number" step="0.01" value={form.depot_garantie} onChange={e => onChange('depot_garantie', e.target.value)} placeholder="0.00" className="rounded-r-none" />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r bg-amber-50 text-amber-700">MAD</span>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Mode de paiement</Label>
              <Select value={form.mode_paiement} onValueChange={(v) => onChange('mode_paiement', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
              <Select value={form.statut} onValueChange={(v) => onChange('statut', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="resilie">Résilié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!!saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          {saving ? 'Enregistrement...' : 'Enregistrer le bail'}
        </Button>
      </div>
    </form>
  );
}
