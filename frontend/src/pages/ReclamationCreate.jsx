import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateReclamationMutation, useUpdateReclamationMutation, useGetReclamationQuery, useGetReclamationsQuery, useGetReclamationTypesQuery, useGetBauxQuery } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function ReclamationCreate() {
  const { can } = useAuthz();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;
  const { data: types } = useGetReclamationTypesQuery();
  const { data: bauxData } = useGetBauxQuery({ per_page: 1000 });
  const baux = bauxData?.data || [];
  const [createRec, { isLoading: isCreating }] = useCreateReclamationMutation();
  const [updateRec, { isLoading: isUpdating }] = useUpdateReclamationMutation();
  const { data: recList } = useGetReclamationsQuery({}, { skip: !isEdit });
  const reclamationFromState = location.state?.reclamation;

  const [form, setForm] = useState({ bail_id: '', reclamation_type_id: '', description: '', source: '' });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      if (!can(PERMS.reclamations.update)) navigate('/reclamations');
    } else {
      if (!can(PERMS.reclamations.create)) navigate('/reclamations');
    }
  }, [can, navigate, isEdit]);

  // Cache-first, then fallback fetch
  const cachedItem = useMemo(() => {
    if (!isEdit) return null;
    if (reclamationFromState) return reclamationFromState;
    const list = recList?.data || [];
    return list.find(x => x.id === parseInt(id));
  }, [isEdit, reclamationFromState, recList, id]);
  const shouldFetch = isEdit && !cachedItem;
  const { data: fetchedItem, isLoading: loadingFetched, isError: fetchError } = useGetReclamationQuery(id, { skip: !shouldFetch });
  const sourceItem = cachedItem || fetchedItem || null;

  useEffect(() => {
    if (isEdit && sourceItem) {
      setForm({
        bail_id: sourceItem.bail_id || '',
        reclamation_type_id: sourceItem.reclamation_type_id || '',
        description: sourceItem.description || '',
        source: sourceItem.source || '',
      });
    }
  }, [isEdit, sourceItem]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        const payload = { ...form };
        await updateRec({ id, payload }).unwrap();
      } else {
        const payload = { ...form, files };
        await createRec(payload).unwrap();
      }
      navigate('/reclamations');
    } catch (err) {
      setError(err?.data?.message || 'Erreur');
    }
  };

  // react-select styles to match shadcn
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.375rem',
      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
      '&:hover': { borderColor: 'hsl(var(--ring))' },
      minHeight: '2.5rem',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      border: '1px solid hsl(var(--border))',
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'hsl(var(--primary))' : state.isFocused ? 'hsl(var(--accent))' : 'transparent',
      color: state.isSelected ? 'hsl(var(--primary-foreground))' : state.isFocused ? 'hsl(var(--accent-foreground))' : 'inherit',
      cursor: 'pointer',
      fontSize: '0.875rem',
    }),
  };

  const bailOptions = (baux || []).map(b => ({
    value: String(b.id),
    label: `${b.numero_bail || `Bail #${b.id}`}${b.locataire ? ` - ${b.locataire.nom || ''}` : ''}`.trim()
  }));
  const typeOptions = (types || []).map(t => ({ value: String(t.id), label: t.name }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? 'Modifier réclamation' : 'Nouvelle réclamation'}
          </h1>
          <p className="text-slate-500">{isEdit ? 'Mettre à jour la réclamation' : 'Créer une réclamation et joindre des justificatifs.'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/reclamations')}>Retour</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isEdit ? 'Modification' : 'Création'}</CardTitle>
          <CardDescription>Renseignez les champs obligatoires puis enregistrez.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Bail <span className="text-red-500">*</span></Label>
                <Select
                  styles={customSelectStyles}
                  options={bailOptions}
                  value={form.bail_id ? bailOptions.find(o => o.value === String(form.bail_id)) : null}
                  onChange={(opt) => setForm(f => ({ ...f, bail_id: opt ? opt.value : '' }))}
                  isClearable
                  isSearchable
                  placeholder="Sélectionner un bail..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Type de réclamation <span className="text-red-500">*</span></Label>
                <Select
                  styles={customSelectStyles}
                  options={typeOptions}
                  value={form.reclamation_type_id ? typeOptions.find(o => o.value === String(form.reclamation_type_id)) : null}
                  onChange={(opt) => setForm(f => ({ ...f, reclamation_type_id: opt ? opt.value : '' }))}
                  isClearable
                  isSearchable
                  placeholder="Sélectionner un type..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description détaillée <span className="text-red-500">*</span></Label>
              <Textarea
                rows={6}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez la réclamation en détail..."
                required
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Fournissez un maximum de détails</span>
                <span className="rounded border px-2 py-0.5 bg-slate-50 text-slate-600">{form.description.length} caractères</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="Ex: locataire, inspection, propriétaire..."
                />
                <div className="text-xs text-muted-foreground">Qui a émis cette réclamation ?</div>
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  <Label>Justificatifs (optionnel)</Label>
                  <Input type="file" multiple onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx" />
                  {files.length > 0 && (
                    <div className="mt-2">
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
                        {files.length} fichier(s) sélectionné(s)
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {files.map((f,i) => (
                          <span key={i} className="text-xs rounded border bg-slate-50 px-2 py-1 text-slate-700">
                            {f.name} <span className="text-slate-400">({(f.size/1024).toFixed(1)} KB)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">PDF, images, documents Word acceptés (max 10MB par fichier)</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/reclamations')} disabled={isCreating || isUpdating}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isEdit ? (isUpdating ? 'Mise à jour...' : 'Mettre à jour') : (isCreating ? 'Enregistrement...' : 'Créer la réclamation')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isEdit && shouldFetch && loadingFetched && (
        <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-sm mt-3">Chargement de la réclamation...</div>
      )}
      {isEdit && shouldFetch && fetchError && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm mt-3">Erreur lors du chargement de la réclamation.</div>
      )}
    </div>
  );
}
