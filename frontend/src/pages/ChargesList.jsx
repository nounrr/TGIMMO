import React, { useState, useMemo } from 'react';
import { 
  useGetImputationChargesQuery, 
  useDeleteImputationChargeMutation,
  useGetUnitesQuery,
  useGetProprietairesQuery,
  useGetBauxQuery,
  useGetInterventionsQuery,
  useGetReclamationsQuery
} from '../api/baseApi';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Search, Loader2, ArrowUpDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import useAuthz from '@/hooks/useAuthz';
import ChargeForm from './ChargeForm';

export default function ChargesList() {
  const { can } = useAuthz();
  const canCreate = can('charges.create');
  const canUpdate = can('charges.update');
  const canDelete = can('charges.delete');

  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const queryParams = useMemo(() => ({
    sort_by: sortBy,
    order: sortOrder,
  }), [sortBy, sortOrder]);

  const { data, isLoading, isFetching } = useGetImputationChargesQuery(queryParams);
  const [deleteCharge] = useDeleteImputationChargeMutation();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const charges = data?.data || []; // Pagination structure might be data.data or just data depending on controller

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) return;
    try {
      await deleteCharge(id).unwrap();
      toast({ title: "Succès", description: "Charge supprimée" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la charge" });
    }
  };

  const openCreate = () => {
    setEditingCharge(null);
    setIsDialogOpen(true);
  };

  const openEdit = (charge) => {
    setEditingCharge(charge);
    setIsDialogOpen(true);
  };

  const filteredCharges = charges.filter(c => 
    c.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.impute_a?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.payer_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch entities for display labels (optional enhancement)
  const { data: unitesData } = useGetUnitesQuery({ per_page: 200 });
  const { data: bauxData } = useGetBauxQuery({ per_page: 200 });
  const { data: locsData } = useGetLocatairesQuery({ per_page: 200 });
  const { data: propsData } = useGetProprietairesQuery({ per_page: 200 });
  const { data: interventionsData } = useGetInterventionsQuery({ per_page: 200 });
  const { data: reclamationsData } = useGetReclamationsQuery({ per_page: 200 });

  const list = (d) => Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
  const unites = list(unitesData);
  const baux = list(bauxData);
  const locataires = list(locsData);
  const proprietaires = list(propsData);
  const interventions = list(interventionsData);
  const reclamations = list(reclamationsData);

  const formatProp = useMemo(() => (p) => {
    if (!p) return '';
    const parts = [p.nom, p.prenom].filter(Boolean);
    let base = parts.join(' ').trim();
    if (!base) base = p.raison_sociale || p.nom_ar || p.prenom_ar || `#${p.id}`;
    return base;
  }, []);
  const formatLoc = useMemo(() => (l) => {
    if (!l) return '';
    const parts = [l.nom, l.prenom].filter(Boolean);
    let base = parts.join(' ').trim();
    if (!base) base = l.nom_ar || l.prenom_ar || `#${l.id}`;
    return base;
  }, []);

  const resolveLabel = (charge) => {
    const { impute_a, id_impute } = charge;
    if (!impute_a || !id_impute) return '-';
    const idNum = Number(id_impute);
    switch(impute_a){
      case 'bail': {
        const b = baux.find(x=>x.id===idNum); return b ? (b.numero_bail||`#${b.id}`) : `Bail #${id_impute}`;
      }
      case 'unite': {
        const u = unites.find(x=>x.id===idNum); return u ? (u.numero_unite||u.code||`#${u.id}`) : `Unité #${id_impute}`;
      }
      case 'locataire': {
        const l = locataires.find(x=>x.id===idNum); return l ? formatLoc(l) : `Loc #${id_impute}`;
      }
      case 'proprietaire': {
        const p = proprietaires.find(x=>x.id===idNum); return p ? formatProp(p) : `Prop #${id_impute}`;
      }
      case 'intervention': {
        return `Intervention #${id_impute}`;
      }
      case 'reclamation': {
        return `Réclamation #${id_impute}`;
      }
      case 'charge_libre': return charge.titre || 'Charge libre';
      default: return `#${id_impute}`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Charges</h1>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Nouvelle Charge
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex items-center gap-2 max-w-sm flex-1">
          <Search className="h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date création</SelectItem>
              <SelectItem value="updated_at">Date modification</SelectItem>
              <SelectItem value="montant">Montant</SelectItem>
              <SelectItem value="titre">Titre</SelectItem>
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

      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Type (impute_a)</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead>Payeur</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredCharges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Aucune charge trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredCharges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>#{charge.id}</TableCell>
                  <TableCell className="font-medium">{charge.montant} MAD</TableCell>
                  <TableCell className="capitalize">{charge.impute_a}</TableCell>
                  <TableCell>{resolveLabel(charge)}</TableCell>
                  <TableCell>{charge.payer_type ? (charge.payer_type === 'societe' ? 'Société' : charge.payer_type + (charge.payer_id ? ` #${charge.payer_id}` : '')) : '-'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={charge.notes}>{charge.notes || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {canUpdate && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(charge)}>
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(charge.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCharge ? 'Modifier la charge' : 'Nouvelle charge'}</DialogTitle>
          </DialogHeader>
          <ChargeForm 
            key={editingCharge ? editingCharge.id : 'new'}
            initialData={editingCharge} 
            onSuccess={() => setIsDialogOpen(false)} 
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
