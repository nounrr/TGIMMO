import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetUnitesQuery, useGetProprietairesQuery, useCreateMandatMutation } from '../api/baseApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { FileText, Building, User, Plus, X, ArrowLeft, Save, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';

export default function CreateMandatShadcn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [unitesPage, setUnitesPage] = useState(1);
  const [unitesPerPage] = useState(30);
  const [propsPage, setPropsPage] = useState(1);
  const [propsPerPage] = useState(1000);
  const [filters, setFilters] = useState({ unite: '', proprietaire: '' });
  const { data: unitesData, isFetching: isFetchingUnites } = useGetUnitesQuery({ page: unitesPage, per_page: unitesPerPage, q: filters.unite || undefined });
  const { data: proprietairesData, isFetching: isFetchingProps } = useGetProprietairesQuery({ page: propsPage, per_page: propsPerPage, q: filters.proprietaire || undefined });
  const [createMandat, { isLoading: isCreating }] = useCreateMandatMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    unite_ids: [],
    proprietaire_ids: [],
    date_debut: '',
    date_fin: '',
    statut: 'brouillon',
    reference: '',
    mandat_id: '',
    taux_gestion_pct: '',
    assiette_honoraires: 'loyers_encaisse',
    tva_applicable: false,
    tva_taux: '20',
    frais_min_mensuel: '',
    periodicite_releve: 'mensuel',
    charge_maintenance: '',
    mode_versement: 'virement',
    description_bien: '',
    usage_bien: '',
    lieu_signature: '',
    date_signature: '',
    langue: 'fr',
  });

  const [errors, setErrors] = useState({});

  const [rows, setRows] = useState([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);

  const { total, totalPct, isValidTotal, rowErrors } = useMemo(() => {
    let sum = 0; const validationErrors = [];
    rows.forEach((r, idx) => {
      const num = Number(r.part_numerateur || 0);
      const den = Number(r.part_denominateur || 1);
      if (num <= 0) validationErrors.push(`Ligne ${idx + 1}: numérateur > 0 requis`);
      if (den <= 0) validationErrors.push(`Ligne ${idx + 1}: dénominateur > 0 requis`);
      if (den > 0 && num > den) validationErrors.push(`Ligne ${idx + 1}: numérateur ≤ dénominateur`);
      if (den > 0 && num > 0) sum += num / den;
    });
    return {
      total: sum,
      totalPct: (sum * 100).toFixed(4),
      isValidTotal: Math.abs(sum - 1) < 0.0001 && validationErrors.length === 0,
      rowErrors: validationErrors
    };
  }, [rows]);

  const addRow = () => {
    const newRows = [...rows, { proprietaire_id: '', part_numerateur: 1, part_denominateur: rows.length + 1 }];
    const count = newRows.length;
    setRows(newRows.map(r => ({ ...r, part_numerateur: 1, part_denominateur: count })));
  };

  const removeRow = (idx) => {
    const filtered = rows.filter((_, i) => i !== idx);
    if (!filtered.length) {
        setRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
        return;
    }
    const count = filtered.length;
    setRows(filtered.map(r => ({ ...r, part_numerateur: 1, part_denominateur: count })));
  };

  const updateRow = (idx, patch) => {
    const updated = rows.map((r,i)=> i===idx ? { ...r, ...patch } : r);
    if ((patch.part_numerateur !== undefined || patch.part_denominateur !== undefined) && rows.length === 2) {
      const other = idx === 0 ? 1 : 0;
      const changed = updated[idx];
      const num = Number(changed.part_numerateur || 0);
      const den = Number(changed.part_denominateur || 1);
      if (num > 0 && den > 0 && den >= num) {
        const remainingFraction = 1 - num/den;
        if (remainingFraction >= 0 && remainingFraction <= 1) {
          const remainingNum = Math.round(remainingFraction * den);
          updated[other] = { ...updated[other], part_numerateur: remainingNum, part_denominateur: den };
        }
      }
    }
    setRows(updated);
  };

  const unites = useMemo(() => unitesData?.data || [], [unitesData]);
  const unitesMeta = useMemo(() => unitesData || { current_page: 1, last_page: 1, total: 0 }, [unitesData]);
  const proprietairesOptions = useMemo(() => proprietairesData?.data || [], [proprietairesData]);
  const proprietairesMeta = useMemo(() => proprietairesData || { current_page: 1, last_page: 1, total: 0 }, [proprietairesData]);

  // Get unique proprietaires from selected unites
  const selectedProprietaires = useMemo(() => {
    if (!formData.unite_ids.length) return [];
    
    const proprietaireMap = new Map();
    
    formData.unite_ids.forEach(uniteId => {
      const unite = unites.find(u => u.id === parseInt(uniteId));
      if (unite && unite.proprietaires) {
        unite.proprietaires.forEach(prop => {
          if (!proprietaireMap.has(prop.id)) {
            proprietaireMap.set(prop.id, {
              ...prop,
              unites: [unite.numero_unite || `Unité ${unite.id}`]
            });
          } else {
            const existing = proprietaireMap.get(prop.id);
            existing.unites.push(unite.numero_unite || `Unité ${unite.id}`);
          }
        });
      }
    });
    
    const autoProps = Array.from(proprietaireMap.values());
    // Merge with manually selected proprietaire_ids (ensure unique)
    if (formData.proprietaire_ids.length) {
      const selectedMap = new Map(autoProps.map(p => [p.id, p]));
      formData.proprietaire_ids.forEach(pid => {
        if (!selectedMap.has(pid)) {
          const p = proprietairesOptions.find(pp => pp.id === pid);
          if (p) selectedMap.set(pid, { ...p, unites: [] });
        }
      });
      return Array.from(selectedMap.values());
    }
    return autoProps;
  }, [formData.unite_ids, unites]);

  const toggleProprietaire = (propId) => {
    const id = parseInt(propId);
    setFormData(prev => ({
      ...prev,
      proprietaire_ids: prev.proprietaire_ids.includes(id)
        ? prev.proprietaire_ids.filter(pid => pid !== id)
        : [...prev.proprietaire_ids, id]
    }));
  };

  const handleUniteToggle = (uniteId) => {
    const id = parseInt(uniteId);
    setFormData(prev => ({
      ...prev,
      unite_ids: prev.unite_ids.includes(id)
        ? prev.unite_ids.filter(uid => uid !== id)
        : [...prev.unite_ids, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrors({});
    
    if (formData.unite_ids.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner au moins une unité"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        taux_gestion_pct: formData.taux_gestion_pct === '' ? null : formData.taux_gestion_pct,
        tva_applicable: formData.tva_applicable ? 1 : 0,
        owners: rows.map(r => ({
            proprietaire_id: r.proprietaire_id,
            part_numerateur: r.part_numerateur,
            part_denominateur: r.part_denominateur
        })).filter(r => r.proprietaire_id) // Ensure we only send rows with selected owner
      };
      
      const result = await createMandat(payload).unwrap();
      
      toast({
        title: "Succès",
        description: "Mandat créé avec succès"
      });
      
      navigate(`/mandats/${result.id}`);
    } catch (error) {
      setIsSubmitting(false);
      if (error.status === 422 && error.data?.errors) {
        setErrors(error.data.errors);
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.data?.message || "Erreur lors de la création du mandat"
        });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/mandats')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Nouveau mandat de gestion
            </h1>
            <p className="text-slate-500">Créer un mandat pour une ou plusieurs unités</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selection des unités */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Sélection des unités
            </CardTitle>
            <CardDescription>
              Sélectionnez une ou plusieurs unités pour ce mandat. Les propriétaires seront automatiquement associés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isFetchingUnites ? 'Chargement…' : `${unitesMeta.total ?? ''} résultats`}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={unitesMeta.current_page <= 1 || isFetchingUnites} onClick={() => setUnitesPage(p => Math.max(1, p - 1))}>Précédent</Button>
                <span className="text-sm">Page {unitesMeta.current_page} / {unitesMeta.last_page}</span>
                <Button type="button" variant="outline" size="sm" disabled={unitesMeta.current_page >= unitesMeta.last_page || isFetchingUnites} onClick={() => setUnitesPage(p => Math.min(unitesMeta.last_page, p + 1))}>Suivant</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ajouter une unité</Label>
              <select
                className="w-full border rounded-md p-2 bg-white"
                value=""
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!val) return;
                  setFormData(prev => (
                    prev.unite_ids.includes(val)
                      ? prev
                      : { ...prev, unite_ids: [...prev.unite_ids, val] }
                  ));
                }}
              >
                <option value="">Sélectionner une unité…</option>
                {unites
                  .filter(unite => {
                    if (formData.unite_ids.includes(unite.id)) return false; // already selected
                    // hide units that already have any proprietaires (ownership exists)
                    if (Array.isArray(unite.proprietaires) && unite.proprietaires.length > 0) return false;
                    // also hide units linked to any currently selected proprietaire (defensive)
                    if (Array.isArray(unite.proprietaires) && formData.proprietaire_ids.length > 0) {
                      const linked = unite.proprietaires.some(p => formData.proprietaire_ids.includes(p.id));
                      if (linked) return false;
                    }
                    return true;
                  })
                  .map(unite => (
                  <option key={unite.id} value={unite.id}>
                    {(unite.numero_unite || `Unité #${unite.id}`)} — {(unite.immeuble || unite.adresse || '-')}
                  </option>
                  ))}
              </select>
              <div className="text-xs text-muted-foreground">
                {unitesMeta.total ?? unites.length} résultats
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Astuce: les unités déjà sélectionnées ou déjà liées aux propriétaires choisis sont masquées dans cette liste.
              </div>
            </div>
            
            {formData.unite_ids.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  {formData.unite_ids.length} unité{formData.unite_ids.length > 1 ? 's' : ''} sélectionnée{formData.unite_ids.length > 1 ? 's' : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.unite_ids.map(uid => {
                    const unite = unites.find(u => u.id === uid);
                    return unite ? (
                      <Badge key={uid} variant="outline" className="bg-white">
                        {unite.numero_unite || `Unité #${unite.id}`}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUniteToggle(uid);
                          }}
                          className="ml-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Propriétaires et Parts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Propriétaires et Parts
            </CardTitle>
            <CardDescription>
              Définissez la répartition des parts entre les propriétaires pour ce mandat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Numérateur</TableHead>
                    <TableHead>Dénominateur</TableHead>
                    <TableHead>Part %</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => {
                    const num = Number(r.part_numerateur || 0);
                    const den = Number(r.part_denominateur || 1);
                    const pct = den > 0 && num > 0 ? ((num/den)*100).toFixed(2) : '0.00';
                    const hasError = num <= 0 || den <= 0 || num > den;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <ReactSelect
                            options={proprietairesOptions.map(p => ({ value: p.id, label: `${p.nom_raison} (${p.email})` }))}
                            value={r.proprietaire_option || (r.proprietaire_id ? { value: r.proprietaire_id, label: proprietairesOptions.find(p => p.id == r.proprietaire_id)?.nom_raison || 'Chargement...' } : null)}
                            onChange={(opt) => updateRow(idx, { proprietaire_id: opt ? opt.value : '', proprietaire_option: opt })}
                            placeholder="Choisir..."
                            className="w-[300px] text-sm"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={r.part_numerateur}
                                 onChange={(e)=>updateRow(idx,{ part_numerateur: e.target.value })}
                                 className={`w-20 ${hasError ? 'border-red-500' : ''}`} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={r.part_denominateur}
                                 onChange={(e)=>updateRow(idx,{ part_denominateur: e.target.value })}
                                 className={`w-20 ${hasError ? 'border-red-500' : ''}`} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={hasError ? 'bg-red-100 text-red-700 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={()=>removeRow(idx)} className="text-red-600 hover:bg-red-50" title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="p-3 border-t flex justify-between items-center">
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" /> Ajouter un propriétaire
                </Button>
                <div className={`text-sm font-medium ${isValidTotal ? 'text-emerald-600' : 'text-red-600'}`}>
                    Total: {totalPct}% {isValidTotal ? '(OK)' : '(Doit = 100%)'}
                </div>
              </div>
            </div>
            {rowErrors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                  <ul className="list-disc list-inside">
                    {rowErrors.map((er,i)=>(<li key={i}>{er}</li>))}
                  </ul>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Informations du mandat */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du mandat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="REF-2025-001"
                />
                {errors.reference && <p className="text-xs text-destructive">{errors.reference[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mandat_id">ID Mandat</Label>
                <Input
                  id="mandat_id"
                  value={formData.mandat_id}
                  onChange={(e) => setFormData({ ...formData, mandat_id: e.target.value })}
                  placeholder="M-2025-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_debut">Date début</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                />
                {errors.date_debut && <p className="text-xs text-destructive">{errors.date_debut[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_fin">Date fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                />
                {errors.date_fin && <p className="text-xs text-destructive">{errors.date_fin[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                  <SelectTrigger id="statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="en_validation">En validation</SelectItem>
                    <SelectItem value="signe">Signé</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="modifier">À Modifier</SelectItem>
                    <SelectItem value="resilie">Résilié</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taux_gestion_pct">Taux de gestion (%)</Label>
                <Input
                  id="taux_gestion_pct"
                  type="number"
                  step="0.01"
                  value={formData.taux_gestion_pct}
                  onChange={(e) => setFormData({ ...formData, taux_gestion_pct: e.target.value })}
                  placeholder="Ex: 5.00"
                />
                <p className="text-xs text-muted-foreground">Ce taux sera appliqué à toutes les unités sélectionnées.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/mandats')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isCreating || isSubmitting || formData.unite_ids.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isCreating || isSubmitting ? 'Création...' : 'Créer le mandat'}
          </Button>
        </div>
      </form>
    </div>
  );
}
