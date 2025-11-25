import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInterventionsQuery, useGetBauxQuery, useDeleteInterventionMutation } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Search, Filter, AlertTriangle, Info, Calendar, CheckCircle, XCircle, Clock, Lock, ArrowUpDown } from 'lucide-react';

export default function InterventionsShadcn() {
  const { can } = useAuthz();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [urgence, setUrgence] = useState('all');
  const [bailId, setBailId] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const params = useMemo(() => ({
    q: q || undefined,
    status: status !== 'all' ? status : undefined,
    urgence: urgence !== 'all' ? urgence : undefined,
    bail_id: bailId !== 'all' ? bailId : undefined,
    sort_by: sortBy,
    order: sortOrder,
  }), [q, status, urgence, bailId, sortBy, sortOrder]);

  const { data, isLoading } = useGetInterventionsQuery(params);
  const items = data?.data || [];
  const { data: bauxData } = useGetBauxQuery({ per_page: 1000 });
  const baux = bauxData?.data || [];
  const [deleteIntervention] = useDeleteInterventionMutation();

  if (!can(PERMS.interventions.view)) {
    return <div className="p-6 text-red-500">Accès refusé</div>;
  }

  const getUrgenceBadge = (urg) => {
    const cfg = {
      urgent: { color: 'bg-red-500 text-white border-red-600', icon: AlertTriangle, label: 'Urgent', pulse: true },
      normal: { color: 'bg-blue-500 text-white border-blue-600', icon: Info, label: 'Normal' },
      planifie: { color: 'bg-amber-500 text-white border-amber-600', icon: Calendar, label: 'Planifié' },
    };
    const c = cfg[urg] || { color: 'bg-slate-500 text-white', icon: Info, label: urg };
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} hover:${c.color} border flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const getStatusBadge = (st) => {
    const cfg = {
      ouvert: { color: 'bg-red-100 text-red-700', label: 'Ouvert' },
      planifie: { color: 'bg-blue-100 text-blue-700', label: 'Planifié' },
      en_cours: { color: 'bg-amber-100 text-amber-700', label: 'En cours' },
      resolu: { color: 'bg-green-100 text-green-700', label: 'Résolu' },
      ferme: { color: 'bg-slate-100 text-slate-700', label: 'Fermé' },
      annule: { color: 'bg-slate-800 text-white', label: 'Annulé' },
    };
    const c = cfg[st] || { color: 'bg-slate-100 text-slate-700', label: st };
    return (
      <Badge variant="outline" className={`${c.color} border-0 w-fit`}>
        {c.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-8 w-8 text-amber-600" />
            Interventions
          </h1>
          <p className="text-slate-500">Suivi et planification des interventions techniques.</p>
        </div>
        {can(PERMS.interventions.create) && (
          <Link to="/interventions/nouveau">
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4" />
              Nouvelle intervention
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
                  placeholder="Rechercher..."
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
                  <SelectItem value="planifie">🔵 Planifié</SelectItem>
                  <SelectItem value="en_cours">🟡 En cours</SelectItem>
                  <SelectItem value="resolu">🟢 Résolu</SelectItem>
                  <SelectItem value="ferme">⚫ Fermé</SelectItem>
                  <SelectItem value="annule">⚪ Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgence</Label>
              <Select value={urgence} onValueChange={setUrgence}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les urgences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les urgences</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="planifie">Planifié</SelectItem>
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
                    <SelectItem value="nature_probleme">Nature</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                    <SelectItem value="urgence">Urgence</SelectItem>
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
                <TableHead>Titre</TableHead>
                <TableHead>Lieu / Bail</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Date planifiée</TableHead>
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
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Aucune intervention trouvée
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">#{item.id}</TableCell>
                    <TableCell className="font-medium">{item.nature_probleme}</TableCell>
                    <TableCell>
                      {item.bail ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.bail.unite?.numero_unite || item.bail.unite?.reference || `Unité #${item.bail.unite_id}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Bail #{item.bail.id}
                          </span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getUrgenceBadge(item.urgence)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {item.date_planifiee ? new Date(item.date_planifiee).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link to={`/interventions/${item.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voir intervention">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-indigo-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8"/><circle cx="12" cy="12" r="3"/></svg>
                        </Button>
                      </Link>
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
