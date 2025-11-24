import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetBauxQuery, useDeleteBailMutation } from '../api/baseApi';
import { useGetLocatairesQuery } from '@/features/locataires/locatairesApi';
import { useGetUnitesQuery } from '@/features/unites/unitesApi';
import useAuthz from '@/hooks/useAuthz';
import { PERMS } from '@/utils/permissionKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Select from 'react-select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Search, Filter, RefreshCw, KeyRound, Pencil, Trash2 } from 'lucide-react';
import BailStatusBadge from '../components/BailStatusBadge';

export default function BauxShadcn() {
  const { can } = useAuthz();
  const [filters, setFilters] = useState({ statut: '', locataire_id: '', unite_id: '', search: '' });

  const queryParams = useMemo(() => {
    const qp = {};
    if (filters.statut) qp.statut = filters.statut;
    if (filters.locataire_id) qp.locataire_id = filters.locataire_id;
    if (filters.unite_id) qp.unite_id = filters.unite_id;
    if (filters.search) qp.search = filters.search;
    return qp;
  }, [filters]);

  const { data, isLoading, isFetching } = useGetBauxQuery(queryParams);
  const [deleteBail, { isLoading: isDeleting }] = useDeleteBailMutation();

  const { data: locatairesData } = useGetLocatairesQuery({ per_page: 1000 });
  const { data: unitesData } = useGetUnitesQuery({ per_page: 1000 });
  const locataires = (locatairesData?.data || locatairesData || []);
  const unites = (unitesData?.data || unitesData || []);
  const baux = data?.data || data || [];

  const onChange = (k, v) => setFilters(f => ({ ...f, [k]: v === 'all' ? '' : v }));

  const handleDownloadDocx = async (bailId) => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/baux/${bailId}/docx`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Echec du téléchargement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bail_${bailId}.docx`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (e) { console.error(e); alert("Impossible de télécharger le document du bail."); }
  };

  const getLocDisplay = (l) => l?.prenom || l?.nom ? `${l?.prenom ?? ''} ${l?.nom ?? ''}`.trim() : (l?.raison_sociale || `#${l?.id}`);
  const getUniteDisplay = (u) => u?.reference || u?.numero_unite || `#${u?.id}`;

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

  const statutOptions = [
    { value: 'actif', label: 'Actif' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'resilie', label: 'Résilié' },
  ];
  const locataireOptions = locataires.map((l) => ({ value: String(l.id), label: getLocDisplay(l) }));
  const uniteOptions = unites.map((u) => ({ value: String(u.id), label: `${getUniteDisplay(u)} - ${u.adresse_complete}` }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Baux locatifs
          </h1>
          <p className="text-slate-500">Gérer les contrats de location</p>
        </div>
        <Link to="/baux/nouveau">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau bail
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" /> Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                styles={customSelectStyles}
                options={statutOptions}
                value={filters.statut ? statutOptions.find(o => o.value === filters.statut) : null}
                onChange={(opt) => onChange('statut', opt ? opt.value : '')}
                isClearable
                isSearchable
                placeholder="Tous les statuts"
                noOptionsMessage={() => 'Aucun statut'}
              />
            </div>
            <div className="space-y-2">
              <Label>Locataire</Label>
              <Select
                styles={customSelectStyles}
                options={locataireOptions}
                value={filters.locataire_id ? locataireOptions.find(o => o.value === filters.locataire_id) : null}
                onChange={(opt) => onChange('locataire_id', opt ? opt.value : '')}
                isClearable
                isSearchable
                placeholder="Tous"
                noOptionsMessage={() => 'Aucun locataire'}
                loadingMessage={() => 'Chargement...'}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Unité</Label>
              <Select
                styles={customSelectStyles}
                options={uniteOptions}
                value={filters.unite_id ? uniteOptions.find(o => o.value === filters.unite_id) : null}
                onChange={(opt) => onChange('unite_id', opt ? opt.value : '')}
                isClearable
                isSearchable
                placeholder="Toutes les unités"
                noOptionsMessage={() => 'Aucune unité'}
                loadingMessage={() => 'Chargement...'}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => setFilters({ statut: '', locataire_id: '', unite_id: '', search: '' })} disabled={isFetching}>
                <RefreshCw className="h-4 w-4 mr-2" /> Réinitialiser
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <Label>Recherche (bail / locataire / unité / propriétaire)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Tapez un mot-clé..."
                value={filters.search}
                onChange={(e) => onChange('search', e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" type="button" onClick={() => onChange('search', filters.search)} disabled={isFetching}>
                <Search className="h-4 w-4 mr-2" /> Chercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>#</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Loyer (MAD)</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Chargement...</TableCell>
                </TableRow>
              ) : baux.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Aucun bail trouvé</TableCell>
                </TableRow>
              ) : (
                baux.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-muted-foreground">{b.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/baux/${b.id}`} state={{ bail: b }} className="text-blue-600 hover:underline">
                        {b.numero_bail}
                      </Link>
                    </TableCell>
                    <TableCell>{getLocDisplay(b.locataire) || `#${b.locataire_id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                        {getUniteDisplay(b.unite)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        {b.unite?.type_unite || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-emerald-700 font-semibold">{b.montant_loyer}</div>
                      <div className="text-xs text-muted-foreground">+ {b.charges} charges</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>Début: {b.date_debut || '-'}</div>
                        <div>Fin: {b.date_fin || 'Indéterminé'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {BailStatusBadge ? <BailStatusBadge statut={b.statut} /> : <Badge>{b.statut}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {can(PERMS.baux.download) && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownloadDocx(b.id)} title="Télécharger DOCX">
                            <Download className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Link to={`/baux/${b.id}/remise-cles`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Remise de clés">
                            <KeyRound className="h-4 w-4 text-amber-600" />
                          </Button>
                        </Link>
                        <Link to={`/baux/${b.id}`} state={{ bail: b }}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Modifier">
                            <Pencil className="h-4 w-4 text-indigo-600" />
                          </Button>
                        </Link>
                        {can(PERMS.baux.delete) && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Supprimer" disabled={isDeleting} onClick={() => { if (confirm('Supprimer ce bail définitivement ?')) deleteBail(b.id); }}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
