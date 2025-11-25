import { useState, useMemo } from 'react';
import {
  useGetPrestatairesQuery,
  useCreatePrestataireMutation,
  useUpdatePrestataireMutation,
  useDeletePrestataireMutation,
} from '../features/prestataires/prestatairesApi';
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
import { Search, Plus, Edit, Trash2, Phone, Mail, Wrench, CreditCard, ArrowUpDown } from 'lucide-react';

export default function PrestataireShadcn() {
  const { can } = useAuthz();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomaine, setSelectedDomaine] = useState('all');
  const [sortBy, setSortBy] = useState('nom_raison');
  const [sortDir, setSortDir] = useState('asc');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [formData, setFormData] = useState({
    nom_raison: '',
    domaine_activite: '',
    contact_nom: '',
    telephone: '',
    email: '',
    adresse: '',
    rc: '',
    ifiscale: '',
    ice: '',
    rib: '',
  });

  const queryParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    q: searchTerm || undefined,
    domaine_activite: selectedDomaine !== 'all' ? selectedDomaine : undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [pagination.pageIndex, pagination.pageSize, searchTerm, selectedDomaine, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const { data, isLoading } = useGetPrestatairesQuery(queryParams);
  const [createPrestataire, { isLoading: isCreating }] = useCreatePrestataireMutation();
  const [updatePrestataire, { isLoading: isUpdating }] = useUpdatePrestataireMutation();
  const [deletePrestataire, { isLoading: isDeleting }] = useDeletePrestataireMutation();

  const currentPageData = useMemo(() => data?.data || [], [data?.data]);
  const totalPages = data?.last_page || 1;

  const handleAdd = () => {
    setSelectedPrestataire(null);
    setFormData({
      nom_raison: '',
      domaine_activite: '',
      contact_nom: '',
      telephone: '',
      email: '',
      adresse: '',
      rc: '',
      ifiscale: '',
      ice: '',
      rib: '',
    });
    setShowFormModal(true);
  };

  const handleEdit = (prestataire) => {
    setSelectedPrestataire(prestataire);
    setFormData({
      nom_raison: prestataire.nom_raison || '',
      domaine_activite: prestataire.domaine_activite || '',
      contact_nom: prestataire.contact_nom || '',
      telephone: prestataire.telephone || '',
      email: prestataire.email || '',
      adresse: prestataire.adresse || '',
      rc: prestataire.rc || '',
      ifiscale: prestataire.ifiscale || '',
      ice: prestataire.ice || '',
      rib: prestataire.rib || '',
    });
    setShowFormModal(true);
  };

  const handleDeleteClick = (prestataire) => {
    setSelectedPrestataire(prestataire);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPrestataire) {
        await updatePrestataire({ id: selectedPrestataire.id, ...formData }).unwrap();
        toast({
          title: 'Succès',
          description: 'Prestataire modifié avec succès',
        });
      } else {
        await createPrestataire(formData).unwrap();
        toast({
          title: 'Succès',
          description: 'Prestataire créé avec succès',
        });
      }
      setShowFormModal(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.data?.message || 'Une erreur est survenue',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePrestataire(selectedPrestataire.id).unwrap();
      toast({
        title: 'Succès',
        description: 'Prestataire supprimé avec succès',
      });
      setShowDeleteModal(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.data?.message || 'Impossible de supprimer ce prestataire',
      });
    }
  };

  if (!can(PERMS.prestataires.view)) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          Accès refusé: vous n'avez pas la permission de voir les prestataires.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Prestataires
          </h1>
          <p className="text-muted-foreground mt-1">Annuaire des prestataires et contacts</p>
        </div>
        {can(PERMS.prestataires.create) && (
          <Button onClick={handleAdd} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nouveau prestataire
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtres
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="search" className="text-sm font-medium mb-1.5 block text-left">
                Recherche
              </Label>
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="domaine" className="text-sm font-medium mb-1.5 block text-left">Domaine</Label>
              <Select value={selectedDomaine} onValueChange={setSelectedDomaine}>
                <SelectTrigger id="domaine">
                  <SelectValue placeholder="Domaine" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les domaines</SelectItem>
                <SelectItem value="Plomberie">Plomberie</SelectItem>
                <SelectItem value="Électricité">Électricité</SelectItem>
                <SelectItem value="Menuiserie">Menuiserie</SelectItem>
                <SelectItem value="Peinture">Peinture</SelectItem>
                <SelectItem value="Climatisation">Climatisation</SelectItem>
                <SelectItem value="Jardin">Jardin</SelectItem>
                <SelectItem value="Nettoyage">Nettoyage</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block text-left">Trier par</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date création</SelectItem>
                    <SelectItem value="updated_at">Date modification</SelectItem>
                    <SelectItem value="nom_raison">Nom / Raison</SelectItem>
                    <SelectItem value="domaine_activite">Domaine</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                  title={sortDir === 'asc' ? "Croissant" : "Décroissant"}
                >
                  <ArrowUpDown className={`h-4 w-4 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('nom_raison')}>
                  Nom / Raison sociale {sortBy === 'nom_raison' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('domaine_activite')}>
                  Domaine d'activité {sortBy === 'domaine_activite' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('contact_nom')}>
                  Contact {sortBy === 'contact_nom' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('email')}>
                  Email {sortBy === 'email' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('rc')}>
                  RC / ICE {sortBy === 'rc' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : currentPageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun prestataire trouvé
                </TableCell>
              </TableRow>
            ) : (
              currentPageData.map((prest) => (
                <TableRow key={prest.id}>
                  <TableCell>
                    <div className="font-semibold">{prest.nom_raison}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      <Wrench className="h-3 w-3 mr-1" />
                      {prest.domaine_activite || 'Non spécifié'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {prest.contact_nom && (
                        <div className="font-medium">{prest.contact_nom}</div>
                      )}
                      {prest.telephone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{prest.telephone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {prest.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[220px]">{prest.email}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {prest.rc && <div>RC: {prest.rc}</div>}
                      {prest.ice && <div>ICE: {prest.ice}</div>}
                      {!prest.rc && !prest.ice && <span>-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {can(PERMS.prestataires.update) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(prest)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {can(PERMS.prestataires.delete) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(prest)}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Pagination */}
          {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {pagination.pageIndex + 1} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
                disabled={pagination.pageIndex === 0}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                disabled={pagination.pageIndex >= totalPages - 1}
              >
                Suivant
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPrestataire ? 'Modifier le prestataire' : 'Nouveau prestataire'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du prestataire
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="domaine_activite">Domaine d'activité</Label>
                <Select
                  value={formData.domaine_activite}
                  onValueChange={(value) => setFormData({ ...formData, domaine_activite: value })}
                >
                  <SelectTrigger id="domaine_activite">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plomberie">Plomberie</SelectItem>
                    <SelectItem value="Électricité">Électricité</SelectItem>
                    <SelectItem value="Menuiserie">Menuiserie</SelectItem>
                    <SelectItem value="Peinture">Peinture</SelectItem>
                    <SelectItem value="Climatisation">Climatisation</SelectItem>
                    <SelectItem value="Jardin">Jardin</SelectItem>
                    <SelectItem value="Nettoyage">Nettoyage</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contact_nom">Nom du contact</Label>
                <Input
                  id="contact_nom"
                  value={formData.contact_nom}
                  onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
                />
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
              <div>
                <Label htmlFor="rc">RC</Label>
                <Input
                  id="rc"
                  value={formData.rc}
                  onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
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
              <div>
                <Label htmlFor="ice">ICE</Label>
                <Input
                  id="ice"
                  value={formData.ice}
                  onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="rib">RIB</Label>
                <Input
                  id="rib"
                  value={formData.rib}
                  onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
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
              Êtes-vous sûr de vouloir supprimer le prestataire{' '}
              <strong>{selectedPrestataire?.nom_raison}</strong> ? Cette action est irréversible.
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
