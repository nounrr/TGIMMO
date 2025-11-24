import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllRemisesClesQuery, useGetBauxQuery } from '../api/baseApi';
import { useGetLocatairesQuery } from '@/features/locataires/locatairesApi';
import useAuthz from '@/hooks/useAuthz';
import { PERMS } from '@/utils/permissionKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Select from 'react-select';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Filter, RefreshCw, Eye } from 'lucide-react';

export default function RemisesClesShadcn() {
  const { can } = useAuthz();
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [locataireId, setLocataireId] = useState('');
  const [bailId, setBailId] = useState('');
  const [typeCle, setTypeCle] = useState('');
  const [withRemarque, setWithRemarque] = useState(false);

  const params = useMemo(() => ({
    q: q || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    locataire_id: locataireId || undefined,
    bail_id: bailId || undefined,
    type: typeCle || undefined,
  }), [q, dateFrom, dateTo, locataireId, bailId, typeCle]);

  const { data, isLoading } = useGetAllRemisesClesQuery(params);
  const remises = data?.data || [];

  const { data: bauxData } = useGetBauxQuery({ per_page: 1000 });
  const baux = bauxData?.data || [];
  const { data: locsData } = useGetLocatairesQuery({ per_page: 1000 });
  const locataires = useMemo(() => {
    if (Array.isArray(locsData?.data)) return locsData.data;
    if (Array.isArray(locsData)) return locsData;
    return [];
  }, [locsData]);

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

  const typeCleOptions = [
    { value: 'porte_principale', label: 'Porte principale' },
    { value: 'boite_lettres', label: 'Boîte aux lettres' },
    { value: 'portail_garage', label: 'Portail / Garage' },
    { value: 'autre', label: 'Autres' },
  ];

  const locataireOptions = locataires.map(l => ({
    value: String(l.id),
    label: l.prenom ? `${l.prenom} ${l.nom}` : (l.nom || l.raison_sociale || `Locataire #${l.id}`)
  }));

  const bailOptions = baux.map(b => ({
    value: String(b.id),
    label: b.numero_bail || `#${b.id}`
  }));

  if (!can(PERMS.remises_cles.view)) {
    return (
      <div className="p-6">
        <div className="bg-amber-100 text-amber-800 px-4 py-3 rounded-lg">Accès refusé</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-8 w-8 text-blue-600" />
            Remises de clés
          </h1>
          <p className="text-slate-500">Historique des remises sur tous les baux</p>
        </div>
        <Link to="/baux">
          <Button variant="outline">Baux</Button>
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
              <Label>Recherche</Label>
              <Input placeholder="Numéro bail, locataire..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type de clé</Label>
              <Select
                styles={customSelectStyles}
                options={typeCleOptions}
                value={typeCle ? typeCleOptions.find(o => o.value === typeCle) : null}
                onChange={(opt) => setTypeCle(opt ? opt.value : '')}
                isClearable
                isSearchable
                placeholder="Toutes"
                noOptionsMessage={() => 'Aucun type'}
              />
            </div>
            <div className="space-y-2">
              <Label>Locataire</Label>
              <Select
                styles={customSelectStyles}
                options={locataireOptions}
                value={locataireId ? locataireOptions.find(o => o.value === locataireId) : null}
                onChange={(opt) => setLocataireId(opt ? opt.value : '')}
                isClearable
                isSearchable
                placeholder="Tous"
                noOptionsMessage={() => 'Aucun locataire'}
                loadingMessage={() => 'Chargement...'}
              />
            </div>
            <div className="space-y-2">
              <Label>Bail</Label>
              <Select
                styles={customSelectStyles}
                options={bailOptions}
                value={bailId ? bailOptions.find(o => o.value === bailId) : null}
                onChange={(opt) => setBailId(opt ? opt.value : '')}
                isClearable
                isSearchable
                placeholder="Tous"
                noOptionsMessage={() => 'Aucun bail'}
                loadingMessage={() => 'Chargement...'}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => { setQ(''); setDateFrom(''); setDateTo(''); setLocataireId(''); setBailId(''); setTypeCle(''); setWithRemarque(false); }} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" /> Réinitialiser
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <input id="withRemarque" type="checkbox" className="h-4 w-4" checked={withRemarque} onChange={(e) => setWithRemarque(e.target.checked)} />
            <Label htmlFor="withRemarque" className="font-normal">Avec remarques</Label>
            <div className="ml-auto">{isLoading ? 'Chargement...' : `${remises.length} remise(s)`}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Bail</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Clés</TableHead>
                <TableHead>Remarques</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement des remises...</TableCell>
                </TableRow>
              ) : remises.filter(r => !withRemarque || (r.remarques && r.remarques.trim().length > 0)).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Aucune remise</TableCell>
                </TableRow>
              ) : (
                remises
                  .filter(r => !withRemarque || (r.remarques && r.remarques.trim().length > 0))
                  .map((r) => {
                    const bail = r.bail; const loc = bail?.locataire;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground">{r.id}</TableCell>
                        <TableCell>{new Date(r.date_remise).toLocaleString()}</TableCell>
                        <TableCell>
                          {bail ? (
                            <Link to={`/baux/${bail.id}`} state={{ bail }} className="text-blue-600 hover:underline">
                              {bail.numero_bail || `#${bail.id}`}
                            </Link>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {loc ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-primary/20">{loc.prenom} {loc.nom}</Badge>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {Array.isArray(r.cles) && r.cles.length > 0 ? (
                            <span>{r.cles.map(c => `${c.label || c.type} (${c.nombre})`).join(', ')}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{r.remarques ? r.remarques.slice(0, 100) : '—'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Link to={`/baux/${bail?.id}/remise-cles`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voir remises du bail">
                                <KeyRound className="h-4 w-4 text-amber-600" />
                              </Button>
                            </Link>
                            <Link to={`/baux/${bail?.id}`} state={{ bail }}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voir bail">
                                <Eye className="h-4 w-4 text-indigo-600" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
