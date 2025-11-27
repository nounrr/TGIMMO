import { useState } from 'react';
import { useGetMandatsQuery } from '../api/baseApi';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Filter, RefreshCw, User, Eye, Edit, ArrowUpDown, Building } from 'lucide-react';
import { PaginationControl } from '@/components/PaginationControl';

export default function MandatsGestionShadcn() {
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  
  const queryParams = {
    page,
    per_page: perPage,
    sort_by: sortBy,
    sort_dir: sortDir,
  };
  if (q) queryParams.q = q;
  
  const { data, isFetching, refetch } = useGetMandatsQuery(queryParams);
  
  const rows = data?.data || data || [];
  const meta = data?.meta || { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const getStatusBadge = (statut) => {
    const map = {
      actif: { className: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200', label: 'Actif' },
      en_cours: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200', label: 'En cours' },
      termine: { className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200', label: 'Terminé' },
      resilie: { className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200', label: 'Résilié' },
      suspendu: { className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200', label: 'Suspendu' },
      brouillon: { className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200', label: 'Brouillon' },
    };
    const cfg = map[statut] || { className: 'bg-slate-100 text-slate-700 hover:bg-slate-100', label: statut };
    return <Badge variant="outline" className={`${cfg.className} border`}>{cfg.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Mandats de gestion
          </h1>
          <p className="text-slate-500">Liste des mandats créés (brouillons et actifs)</p>
        </div>
        <Link to="/mandats/nouveau">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nouveau mandat
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Référence, lieu..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => { setQ(''); refetch(); }}
                className="w-full md:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
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
                <TableHead className="cursor-pointer" onClick={() => handleSort('reference')}>
                  Référence {sortBy === 'reference' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('date_debut')}>
                  Date Début {sortBy === 'date_debut' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('date_fin')}>
                  Date Fin {sortBy === 'date_fin' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('statut')}>
                  Statut {sortBy === 'statut' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Aucun mandat trouvé
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((mandat) => (
                  <TableRow key={mandat.id}>
                    <TableCell className="font-medium">{mandat.reference || `#${mandat.id}`}</TableCell>
                    <TableCell>
                      {mandat.unite ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 rounded-full p-1">
                            <Building className="h-3 w-3 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{mandat.unite.numero_unite}</span>
                            <span className="text-xs text-muted-foreground">{mandat.unite.immeuble}</span>
                          </div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{mandat.date_debut ? new Date(mandat.date_debut).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{mandat.date_fin ? new Date(mandat.date_fin).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{getStatusBadge(mandat.statut)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Link to={`/mandats/${mandat.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination */}
        <PaginationControl
          currentPage={page}
          lastPage={meta.last_page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          total={meta.total}
          from={meta.from}
          to={meta.to}
        />
      </Card>
    </div>
  );
}
