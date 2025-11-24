import { useState, useMemo } from 'react';
import {
  useGetProprietairesQuery,
  useCreateProprietaireMutation,
  useUpdateProprietaireMutation,
  useDeleteProprietaireMutation,
} from '../features/proprietaires/proprietairesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, CreditCard, TrendingUp, ArrowUpDown } from 'lucide-react';

import { useSelector } from 'react-redux';
import { useMeQuery } from '../features/auth/authApi';

export default function ProprietairesShadcn() {
  const { can } = useAuthz();
  const { toast } = useToast();
  const { data: me } = useMeQuery();
  const authUser = useSelector((state) => state.auth.user);
  const user = me || authUser;

  const isCommercial = useMemo(() => {
    return user?.roles?.some(r => (typeof r === 'string' ? r === 'commercial' : r.name === 'commercial'));
  }, [user]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProprietaire, setSelectedProprietaire] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    nom_raison: '',
    nom_ar: '',
    prenom_ar: '',
    type_proprietaire: 'unique',
    statut: 'brouillon',
    telephone: '',
    email: '',
    adresse: '',
    adresse_ar: '',
    cin: '',
    rc: '',
    ice: '',
    ifiscale: '',
    representant_nom: '',
    representant_fonction: '',
    representant_cin: '',
    taux_gestion_tgi_pct: '',
    part_liquidation_pct: '',
    conditions_particulieres: '',
  });

  const queryParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    q: searchTerm,
    type: selectedType === 'all' ? undefined : selectedType,
    statut: selectedStatut === 'all' ? undefined : selectedStatut,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [pagination, searchTerm, selectedType, selectedStatut, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };


  const { data, isLoading, isFetching, refetch } = useGetProprietairesQuery(queryParams);
  const [createProprietaire, { isLoading: isCreating }] = useCreateProprietaireMutation();
  const [updateProprietaire, { isLoading: isUpdating }] = useUpdateProprietaireMutation();
  const [deleteProprietaire, { isLoading: isDeleting }] = useDeleteProprietaireMutation();

  const handleAdd = () => {
    setSelectedProprietaire(null);
    setErrors({});
    setFormData({
      nom_raison: '',
      nom_ar: '',
      prenom_ar: '',
      type_proprietaire: 'unique',
      statut: isCommercial ? 'en_negociation' : 'brouillon',
      telephone: '',
      email: '',
      adresse: '',
      adresse_ar: '',
      cin: '',
      rc: '',
      ice: '',
      ifiscale: '',
      representant_nom: '',
      representant_fonction: '',
      representant_cin: '',
      taux_gestion_tgi_pct: '',
      part_liquidation_pct: '',
      conditions_particulieres: '',
    });
    setShowFormModal(true);
  };

  const handleEdit = (proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setErrors({});
    setFormData({
      nom_raison: proprietaire.nom_raison || '',
      nom_ar: proprietaire.nom_ar || '',
      prenom_ar: proprietaire.prenom_ar || '',
      type_proprietaire: proprietaire.type_proprietaire || 'unique',
      statut: proprietaire.statut || 'brouillon',
      telephone: proprietaire.telephone || '',
      email: proprietaire.email || '',
      adresse: proprietaire.adresse || '',
      adresse_ar: proprietaire.adresse_ar || '',
      cin: proprietaire.cin || '',
      rc: proprietaire.rc || '',
      ice: proprietaire.ice || '',
      ifiscale: proprietaire.ifiscale || '',
      representant_nom: proprietaire.representant_nom || '',
      representant_fonction: proprietaire.representant_fonction || '',
      representant_cin: proprietaire.representant_cin || '',
      taux_gestion_tgi_pct: proprietaire.taux_gestion_tgi_pct || '',
      part_liquidation_pct: proprietaire.part_liquidation_pct || '',
      conditions_particulieres: proprietaire.conditions_particulieres || '',
    });
    setShowFormModal(true);
  };

  const handleDeleteClick = (proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProprietaire) return;
    try {
      await deleteProprietaire(selectedProprietaire.id).unwrap();
      toast({ title: "Succès", description: "Propriétaire supprimé avec succès" });
      setShowDeleteModal(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la suppression" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProprietaire) {
        await updateProprietaire({ id: selectedProprietaire.id, ...formData }).unwrap();
        toast({ title: "Succès", description: "Propriétaire mis à jour avec succès" });
      } else {
        await createProprietaire(formData).unwrap();
        toast({ title: "Succès", description: "Propriétaire créé avec succès" });
      }
      setShowFormModal(false);
    } catch (error) {
      if (error.status === 422 && error.data && error.data.errors) {
        setErrors(error.data.errors);
        toast({ variant: "destructive", title: "Erreur de validation", description: "Veuillez corriger les erreurs dans le formulaire." });
      } else {
        toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de l'enregistrement" });
      }
    }
  };

  const getStatutBadge = (statut) => {
    const variants = {
      brouillon: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      signe: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      actif: 'bg-green-100 text-green-700 hover:bg-green-100',
      resilie: 'bg-red-100 text-red-700 hover:bg-red-100',
      en_negociation: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    };
    const labels = {
      brouillon: 'Brouillon',
      signe: 'Signé',
      actif: 'Actif',
      resilie: 'Résilié',
      en_negociation: 'En négociation',
    };
    return <Badge className={variants[statut] || ''}>{labels[statut] || statut}</Badge>;
  };

  const getTypeBadge = (type) => {
    const labels = {
      unique: 'Propriétaire unique',
      coproprietaire: 'Copropriétaire',
      heritier: 'Héritier',
      sci: 'SCI',
      autre: 'Autre',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  if (!can(PERMS.proprietaires.view)) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          Accès refusé: vous n'avez pas la permission de voir les propriétaires.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propriétaires</h1>
          <p className="text-muted-foreground">
            Gérez vos propriétaires et leurs informations
          </p>
        </div>
        {can(PERMS.proprietaires.create) && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau propriétaire
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un propriétaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="unique">Propriétaire unique</SelectItem>
                <SelectItem value="coproprietaire">Copropriétaire</SelectItem>
                <SelectItem value="heritier">Héritier</SelectItem>
                <SelectItem value="sci">SCI</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="signe">Signé</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="resilie">Résilié</SelectItem>
                <SelectItem value="en_negociation">En négociation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('nom_raison')}>
                    Nom / Raison Sociale {sortBy === 'nom_raison' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('type_proprietaire')}>
                    Type {sortBy === 'type_proprietaire' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('statut')}>
                    Statut {sortBy === 'statut' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun propriétaire trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((proprietaire) => (
                    <TableRow key={proprietaire.id}>
                      <TableCell className="font-medium">
                        {proprietaire.nom_raison}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(proprietaire.type_proprietaire)}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(proprietaire.statut)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {proprietaire.telephone || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {proprietaire.email || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {can(PERMS.proprietaires.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(proprietaire)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {can(PERMS.proprietaires.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(proprietaire)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination would go here */}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProprietaire ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du propriétaire
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.keys(errors).length > 0 && (
              <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive mb-4">
                <p className="font-bold">Erreurs de validation :</p>
                <ul className="list-disc list-inside">
                  {Object.entries(errors).map(([field, msgs]) => (
                    <li key={field}>{msgs[0]}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nom_raison">Nom / Raison sociale *</Label>
                <Input
                  id="nom_raison"
                  value={formData.nom_raison}
                  onChange={(e) => setFormData({ ...formData, nom_raison: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nom_ar">Nom (AR)</Label>
                <Input
                  id="nom_ar"
                  value={formData.nom_ar}
                  onChange={(e) => setFormData({ ...formData, nom_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="prenom_ar">Prénom (AR)</Label>
                <Input
                  id="prenom_ar"
                  value={formData.prenom_ar}
                  onChange={(e) => setFormData({ ...formData, prenom_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="type_proprietaire">Type de propriétaire</Label>
                <Select
                  value={formData.type_proprietaire}
                  onValueChange={(value) => setFormData({ ...formData, type_proprietaire: value })}
                >
                  <SelectTrigger id="type_proprietaire">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unique">Propriétaire unique</SelectItem>
                    <SelectItem value="coproprietaire">Copropriétaire</SelectItem>
                    <SelectItem value="heritier">Héritier</SelectItem>
                    <SelectItem value="sci">SCI</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger id="statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="signe">Signé</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="resilie">Résilié</SelectItem>
                    <SelectItem value="en_negociation">En négociation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adresse_ar">Adresse (AR)</Label>
                <Input
                  id="adresse_ar"
                  value={formData.adresse_ar}
                  onChange={(e) => setFormData({ ...formData, adresse_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="cin">CIN</Label>
                <Input
                  id="cin"
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rc">RC</Label>
                <Input
                  id="rc"
                  value={formData.rc}
                  onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ice">ICE</Label>
                <Input
                  id="ice"
                  value={formData.ice}
                  onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ifiscale">Identifiant Fiscal (IF)</Label>
                <Input
                  id="ifiscale"
                  value={formData.ifiscale}
                  onChange={(e) => setFormData({ ...formData, ifiscale: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="representant_nom">Représentant - Nom</Label>
                <Input
                  id="representant_nom"
                  value={formData.representant_nom}
                  onChange={(e) => setFormData({ ...formData, representant_nom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="representant_fonction">Représentant - Fonction</Label>
                <Input
                  id="representant_fonction"
                  value={formData.representant_fonction}
                  onChange={(e) => setFormData({ ...formData, representant_fonction: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="representant_cin">Représentant - CIN</Label>
                <Input
                  id="representant_cin"
                  value={formData.representant_cin}
                  onChange={(e) => setFormData({ ...formData, representant_cin: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="taux_gestion_tgi_pct">Taux de gestion TGI (%)</Label>
                <Input
                  id="taux_gestion_tgi_pct"
                  type="number"
                  step="0.01"
                  value={formData.taux_gestion_tgi_pct}
                  onChange={(e) => setFormData({ ...formData, taux_gestion_tgi_pct: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="part_liquidation_pct">Part de liquidation (%)</Label>
                <Input
                  id="part_liquidation_pct"
                  type="number"
                  step="0.01"
                  value={formData.part_liquidation_pct}
                  onChange={(e) => setFormData({ ...formData, part_liquidation_pct: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="conditions_particulieres">Conditions particulières</Label>
                <Input
                  id="conditions_particulieres"
                  value={formData.conditions_particulieres}
                  onChange={(e) => setFormData({ ...formData, conditions_particulieres: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)} className="w-full md:w-1/2">
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="w-full md:w-1/2">
                {isCreating || isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le propriétaire{' '}
              <strong>{selectedProprietaire?.nom_raison}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="w-full md:w-1/2">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 w-full md:w-1/2"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
