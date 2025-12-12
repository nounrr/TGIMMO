import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetReclamationsQuery, useGetReclamationTypesQuery, useGetUnitesQuery } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Search, Filter, AlertCircle, CheckCircle, XCircle, Clock, ArrowUpDown } from 'lucide-react';
import { PaginationControl } from '@/components/PaginationControl';

export default function ReclamationsShadcn() {
  const { can } = useAuthz();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [typeId, setTypeId] = useState('all');
  const [uniteId, setUniteId] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const params = useMemo(() => ({
    page,
    per_page: perPage,
    q: q || undefined,
    status: status !== 'all' ? status : undefined,
    reclamation_type_id: typeId !== 'all' ? typeId : undefined,
    unite_id: uniteId !== 'all' ? uniteId : undefined,
    sort_by: sortBy,
    order: sortOrder,
  }), [q, status, typeId, uniteId, sortBy, sortOrder, page, perPage]);

  const { data: recData, isLoading } = useGetReclamationsQuery(params);
  const list = recData?.data || [];
  const meta = recData?.meta || { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 };
  const { data: types } = useGetReclamationTypesQuery();
  const { data: unitesData } = useGetUnitesQuery({ per_page: 1000 });
  const unites = unitesData?.data || [];

  if (!can(PERMS.reclamations.view)) {
    return <div className="p-6 text-red-500">Accès refusé</div>;
  }

  const getStatusBadge = (st) => {
    const cfg = {
      ouvert: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Ouvert' },
      en_cours: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En cours' },
      resolu: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Résolu' },
      ferme: { color: 'bg-slate-100 text-slate-700', icon: XCircle, label: 'Fermé' },
    };
    const c = cfg[st] || { color: 'bg-slate-100 text-slate-700', icon: AlertCircle, label: st };
    const Icon = c.icon;
    return (
      <Badge variant="outline" className={`${c.color} border-0 flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Réclamations
          </h1>
          <p className="text-slate-500">Gestion et suivi des réclamations locatives.</p>
        </div>
        {can(PERMS.reclamations.create) && (
          <Link to="/reclamations/nouveau">
            <Button className="gap-2 bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4" />
              Nouvelle réclamation
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une description..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ouvert">🔴 Ouvert</SelectItem>
                  <SelectItem value="en_cours">🟡 En cours</SelectItem>
                  <SelectItem value="resolu">🟢 Résolu</SelectItem>
                  <SelectItem value="ferme">⚫ Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {(types || []).map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trier par</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date création</SelectItem>
                    <SelectItem value="updated_at">Date modification</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                    <SelectItem value="date_reclamation">Date réclamation</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? "Croissant" : "Décroissant"}
                >
                  <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Aucune réclamation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">#{item.id}</TableCell>
                    <TableCell className="font-medium truncate max-w-[200px]" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell>
                      {item.unite ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.unite.numero_unite || `Unité #${item.unite.id}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.unite.immeuble || item.unite.adresse || '-'}
                          </span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                        {item.type?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.statut)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link to={`/reclamations/${item.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voir réclamation">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8"/><circle cx="12" cy="12" r="3"/></svg>
                        </Button>
                      </Link>
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
