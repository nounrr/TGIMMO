import { useState, useMemo } from 'react';
import {
  useGetLocatairesQuery,
  useCreateLocataireMutation,
  useUpdateLocataireMutation,
  useDeleteLocataireMutation,
} from '../features/locataires/locatairesApi';
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
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, CreditCard, Building2, User, ArrowUpDown } from 'lucide-react';
import { FilePlus2 } from 'lucide-react';

import { useSelector } from 'react-redux';
import { useMeQuery } from '../features/auth/authApi';
import { PaginationControl } from '@/components/PaginationControl';

export default function LocatairesShadcn() {
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
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocataire, setSelectedLocataire] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    type_personne: 'personne',
    nom: '',
    prenom: '',
    nom_ar: '',
    prenom_ar: '',
    raison_sociale: '',
    profession_activite: '',
    telephone: [''],
    email: '',
    adresse_actuelle: '',
    adresse_ar: '',
    ville: '',
    cin: '',
    rc: '',
    ice: '',
    date_naissance: '',
    lieu_naissance: '',
    date_creation_entreprise: '',
    nationalite: '',
    situation_familiale: '',
    nb_personnes_foyer: '',
    ifiscale: '',
    adresse_bien_loue: '',
    employeur_denomination: '',
  });

  const queryParams = useMemo(() => ({
    page,
    per_page: perPage,
    q: searchTerm,
    type_personne: selectedType === 'all' ? undefined : selectedType,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [page, perPage, searchTerm, selectedType, sortBy, sortDir]);

  const { data, isLoading } = useGetLocatairesQuery(queryParams);
    const locataires = data?.data || [];
  const meta = data || {
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const [createLocataire, { isLoading: isCreating }] = useCreateLocataireMutation();
  const [updateLocataire, { isLoading: isUpdating }] = useUpdateLocataireMutation();
  const [deleteLocataire, { isLoading: isDeleting }] = useDeleteLocataireMutation();

  const handleAdd = () => {
    setSelectedLocataire(null);
    setErrors({});
    setFormData({
      type_personne: 'personne',
      nom: '',
      prenom: '',
      nom_ar: '',
      prenom_ar: '',
      raison_sociale: '',
      profession_activite: '',
      telephone: [''],
      email: '',
      adresse_actuelle: '',
      adresse_ar: '',
      cin: '',
      rc: '',
      ice: '',
      date_naissance: '',
      lieu_naissance: '',
      date_creation_entreprise: '',
      nationalite: '',
      situation_familiale: '',
      nb_personnes_foyer: '',
      ifiscale: '',
      adresse_bien_loue: '',
      employeur_denomination: '',
      employeur_adresse: '',
      type_contrat: '',
      revenu_mensuel_net: '',
      chiffre_affaires_dernier_ex: '',
      exercice_annee: '',
      anciennete_mois: '',
      references_locatives: '',
      statut: isCommercial ? 'en_negociation' : 'actif',
    });
    setShowFormModal(true);
  };

  const handleEdit = (locataire) => {
    setSelectedLocataire(locataire);
    setErrors({});
    setFormData({
      type_personne: locataire.type_personne || 'personne',
      nom: locataire.nom || '',
      prenom: locataire.prenom || '',
      nom_ar: locataire.nom_ar || '',
      prenom_ar: locataire.prenom_ar || '',
      raison_sociale: locataire.raison_sociale || '',
      profession_activite: locataire.profession_activite || '',
      telephone: Array.isArray(locataire.telephone) ? locataire.telephone : (locataire.telephone ? [locataire.telephone] : ['']),
      email: locataire.email || '',
      adresse_actuelle: locataire.adresse_actuelle || '',
      adresse_ar: locataire.adresse_ar || '',
      cin: locataire.cin || '',
      rc: locataire.rc || '',
      ice: locataire.ice || '',
      date_naissance: locataire.date_naissance ? locataire.date_naissance.split('T')[0].split(' ')[0] : '',
      lieu_naissance: locataire.lieu_naissance || '',
      date_creation_entreprise: locataire.date_creation_entreprise ? locataire.date_creation_entreprise.split('T')[0].split(' ')[0] : '',
      nationalite: locataire.nationalite || '',
      situation_familiale: locataire.situation_familiale || '',
      nb_personnes_foyer: locataire.nb_personnes_foyer || '',
      ifiscale: locataire.ifiscale || '',
      adresse_bien_loue: locataire.adresse_bien_loue || '',
      employeur_denomination: locataire.employeur_denomination || '',
      employeur_adresse: locataire.employeur_adresse || '',
      type_contrat: locataire.type_contrat || '',
      revenu_mensuel_net: locataire.revenu_mensuel_net || '',
      chiffre_affaires_dernier_ex: locataire.chiffre_affaires_dernier_ex || '',
      exercice_annee: locataire.exercice_annee || '',
      anciennete_mois: locataire.anciennete_mois || '',
      references_locatives: locataire.references_locatives || '',
      statut: locataire.statut || 'actif',
    });
    setShowFormModal(true);
  };

  const handleDeleteClick = (locataire) => {
    setSelectedLocataire(locataire);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocataire) return;
    try {
      await deleteLocataire(selectedLocataire.id).unwrap();
      toast({ title: "Succès", description: "Locataire supprimé avec succès" });
      setShowDeleteModal(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la suppression" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLocataire) {
        await updateLocataire({ id: selectedLocataire.id, ...formData }).unwrap();
        toast({ title: "Succès", description: "Locataire mis à jour avec succès" });
      } else {
        await createLocataire(formData).unwrap();
        toast({ title: "Succès", description: "Locataire créé avec succès" });
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

  // ... (getTypeBadge, getDisplayName)

  const getTypeBadge = (type) => {
    const variants = {
      personne: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      societe: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    };
    const labels = {
      personne: 'Personne',
      societe: 'Société',
    };
    return <Badge className={variants[type] || ''}>{labels[type] || type}</Badge>;
  };

  const getDisplayName = (locataire) => {
    if (!locataire) return '';
    if (locataire.type_personne === 'societe') {
      return locataire.raison_sociale;
    }
    return `${locataire.nom} ${locataire.prenom}`;
  };

  const getStatutBadge = (statut) => {
    const variants = {
      actif: 'bg-green-100 text-green-700 hover:bg-green-100',
      inactif: 'bg-red-100 text-red-700 hover:bg-red-100',
      brouillon: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    };
    const labels = {
      actif: 'Actif',
      inactif: 'Inactif',
      brouillon: 'Brouillon',
    };
    return <Badge className={variants[statut] || ''}>{labels[statut] || statut}</Badge>;
  };

  if (!can(PERMS.locataires.view)) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          Accès refusé: vous n'avez pas la permission de voir les locataires.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locataires</h1>
          <p className="text-muted-foreground">
            Gérez vos locataires et leurs informations
          </p>
        </div>
        {can(PERMS.locataires.create) && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau locataire
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un locataire..."
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
                <SelectItem value="personne">Personne</SelectItem>
                <SelectItem value="societe">Société</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date création</SelectItem>
                <SelectItem value="updated_at">Date modification</SelectItem>
                <SelectItem value="nom">Nom</SelectItem>
                <SelectItem value="raison_sociale">Raison Sociale</SelectItem>
                <SelectItem value="email">Email</SelectItem>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('nom')}>
                    Nom / Raison Sociale {sortBy === 'nom' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('type_personne')}>
                    Type {sortBy === 'type_personne' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('statut')}>
                    Statut {sortBy === 'statut' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('cin')}>
                    CIN / ICE {sortBy === 'cin' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun locataire trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((locataire) => {
                    const baux = locataire.baux || locataire.baux_actifs || [];
                    const activeBail = baux.find(b => ['actif', 'signe', 'en_attente'].includes(b.statut)) || baux[0];
                    const unite = activeBail ? activeBail.unite : null;
                    const proprietaires = unite && unite.proprietaires ? unite.proprietaires : [];
                    const proprietaireNames = proprietaires.map(p => p.nom_raison || p.nom || p.email).join(', ');

                    return (
                    <TableRow key={locataire.id}>
                      <TableCell className="font-medium">
                        {getDisplayName(locataire)}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(locataire.type_personne)}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(locataire.statut)}
                      </TableCell>
                      <TableCell>
                        {locataire.type_personne === 'societe' ? (locataire.ice || '-') : (locataire.cin || '-')}
                      </TableCell>
                      <TableCell>
                        {proprietaireNames || '-'}
                      </TableCell>
                      <TableCell>
                        {unite ? (unite.numero_unite || unite.id) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="flex items-start gap-1">
                            <Phone className="h-3 w-3 mt-1" /> 
                            <div className="flex flex-col">
                                {Array.isArray(locataire.telephone) ? locataire.telephone.map((tel, i) => (
                                    <span key={i}>{tel}</span>
                                )) : (locataire.telephone || '-')}
                            </div>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {locataire.email || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Quick create bail from locataire */}
                          {can(PERMS.baux.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Créer bail pour ce locataire"
                              onClick={() => window.location.assign(`/baux/nouveau?locataire_id=${locataire.id}`)}
                            >
                              <FilePlus2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {can(PERMS.locataires.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(locataire)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {can(PERMS.locataires.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(locataire)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

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
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLocataire ? 'Modifier le locataire' : 'Nouveau locataire'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du locataire
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
                <Label htmlFor="type_personne">Type *</Label>
                <Select
                  value={formData.type_personne}
                  onValueChange={(value) => setFormData({ ...formData, type_personne: value })}
                >
                  <SelectTrigger id="type_personne">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personne">Personne</SelectItem>
                    <SelectItem value="societe">Société</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Champs selon le type */}
              {formData.type_personne === 'personne' ? (
                <>
                  <div>
                    <Label htmlFor="prenom" className={errors.prenom ? "text-destructive" : ""}>Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className={errors.prenom ? "border-destructive" : ""}
                    />
                    {errors.prenom && <p className="text-xs text-destructive mt-1">{errors.prenom[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nom" className={errors.nom ? "text-destructive" : ""}>Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      className={errors.nom ? "border-destructive" : ""}
                    />
                    {errors.nom && <p className="text-xs text-destructive mt-1">{errors.nom[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="prenom_ar" className={errors.prenom_ar ? "text-destructive" : ""}>Prénom (AR)</Label>
                    <Input
                      id="prenom_ar"
                      value={formData.prenom_ar}
                      onChange={(e) => setFormData({ ...formData, prenom_ar: e.target.value })}
                      dir="rtl"
                      className={errors.prenom_ar ? "border-destructive" : ""}
                    />
                    {errors.prenom_ar && <p className="text-xs text-destructive mt-1">{errors.prenom_ar[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nom_ar" className={errors.nom_ar ? "text-destructive" : ""}>Nom (AR)</Label>
                    <Input
                      id="nom_ar"
                      value={formData.nom_ar}
                      onChange={(e) => setFormData({ ...formData, nom_ar: e.target.value })}
                      dir="rtl"
                      className={errors.nom_ar ? "border-destructive" : ""}
                    />
                    {errors.nom_ar && <p className="text-xs text-destructive mt-1">{errors.nom_ar[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="date_naissance" className={errors.date_naissance ? "text-destructive" : ""}>Date de naissance</Label>
                    <Input
                      id="date_naissance"
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                      className={errors.date_naissance ? "border-destructive" : ""}
                    />
                    {errors.date_naissance && <p className="text-xs text-destructive mt-1">{errors.date_naissance[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lieu_naissance" className={errors.lieu_naissance ? "text-destructive" : ""}>Lieu de naissance</Label>
                    <Input
                      id="lieu_naissance"
                      value={formData.lieu_naissance}
                      onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                      className={errors.lieu_naissance ? "border-destructive" : ""}
                    />
                    {errors.lieu_naissance && <p className="text-xs text-destructive mt-1">{errors.lieu_naissance[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nationalite" className={errors.nationalite ? "text-destructive" : ""}>Nationalité</Label>
                    <Input
                      id="nationalite"
                      value={formData.nationalite}
                      onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                      className={errors.nationalite ? "border-destructive" : ""}
                    />
                    {errors.nationalite && <p className="text-xs text-destructive mt-1">{errors.nationalite[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="situation_familiale" className={errors.situation_familiale ? "text-destructive" : ""}>Situation familiale</Label>
                    <Select
                      value={formData.situation_familiale}
                      onValueChange={(value) => setFormData({ ...formData, situation_familiale: value })}
                    >
                      <SelectTrigger id="situation_familiale" className={errors.situation_familiale ? "border-destructive" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celibataire">Célibataire</SelectItem>
                        <SelectItem value="marie">Marié(e)</SelectItem>
                        <SelectItem value="divorce">Divorcé(e)</SelectItem>
                        <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.situation_familiale && <p className="text-xs text-destructive mt-1">{errors.situation_familiale[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nb_personnes_foyer" className={errors.nb_personnes_foyer ? "text-destructive" : ""}>Nombre de personnes au foyer</Label>
                    <Input
                      id="nb_personnes_foyer"
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={formData.nb_personnes_foyer}
                      onChange={(e) => setFormData({ ...formData, nb_personnes_foyer: e.target.value })}
                      className={errors.nb_personnes_foyer ? "border-destructive" : ""}
                    />
                    {errors.nb_personnes_foyer && <p className="text-xs text-destructive mt-1">{errors.nb_personnes_foyer[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cin" className={errors.cin ? "text-destructive" : ""}>CIN</Label>
                    <Input
                      id="cin"
                      value={formData.cin}
                      onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                      className={errors.cin ? "border-destructive" : ""}
                    />
                    {errors.cin && <p className="text-xs text-destructive mt-1">{errors.cin[0]}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <Label htmlFor="raison_sociale" className={errors.raison_sociale ? "text-destructive" : ""}>Raison sociale *</Label>
                    <Input
                      id="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                      required
                      className={errors.raison_sociale ? "border-destructive" : ""}
                    />
                    {errors.raison_sociale && <p className="text-xs text-destructive mt-1">{errors.raison_sociale[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="prenom" className={errors.prenom ? "text-destructive" : ""}>Prénom du représentant</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className={errors.prenom ? "border-destructive" : ""}
                    />
                    {errors.prenom && <p className="text-xs text-destructive mt-1">{errors.prenom[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nom" className={errors.nom ? "text-destructive" : ""}>Nom du représentant *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      className={errors.nom ? "border-destructive" : ""}
                    />
                    {errors.nom && <p className="text-xs text-destructive mt-1">{errors.nom[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="date_creation_entreprise" className={errors.date_creation_entreprise ? "text-destructive" : ""}>Date de création</Label>
                    <Input
                      id="date_creation_entreprise"
                      type="date"
                      value={formData.date_creation_entreprise}
                      onChange={(e) => setFormData({ ...formData, date_creation_entreprise: e.target.value })}
                      className={errors.date_creation_entreprise ? "border-destructive" : ""}
                    />
                    {errors.date_creation_entreprise && <p className="text-xs text-destructive mt-1">{errors.date_creation_entreprise[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="rc" className={errors.rc ? "text-destructive" : ""}>RC</Label>
                    <Input
                      id="rc"
                      value={formData.rc}
                      onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                      className={errors.rc ? "border-destructive" : ""}
                    />
                    {errors.rc && <p className="text-xs text-destructive mt-1">{errors.rc[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="ice" className={errors.ice ? "text-destructive" : ""}>ICE</Label>
                    <Input
                      id="ice"
                      maxLength={15}
                      placeholder="15 chiffres"
                      value={formData.ice}
                      onChange={(e) => setFormData({ ...formData, ice: e.target.value.replace(/\D/g, '') })}
                      className={errors.ice ? "border-destructive" : ""}
                    />
                    {errors.ice && <p className="text-xs text-destructive mt-1">{errors.ice[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="ifiscale" className={errors.ifiscale ? "text-destructive" : ""}>Identifiant Fiscal</Label>
                    <Input
                      id="ifiscale"
                      value={formData.ifiscale}
                      onChange={(e) => setFormData({ ...formData, ifiscale: e.target.value })}
                      className={errors.ifiscale ? "border-destructive" : ""}
                    />
                    {errors.ifiscale && <p className="text-xs text-destructive mt-1">{errors.ifiscale[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="chiffre_affaires_dernier_ex" className={errors.chiffre_affaires_dernier_ex ? "text-destructive" : ""}>Capital Social</Label>
                    <Input
                      id="chiffre_affaires_dernier_ex"
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      step="0.01"
                      value={formData.chiffre_affaires_dernier_ex}
                      onChange={(e) => setFormData({ ...formData, chiffre_affaires_dernier_ex: e.target.value })}
                      className={errors.chiffre_affaires_dernier_ex ? "border-destructive" : ""}
                    />
                    {errors.chiffre_affaires_dernier_ex && <p className="text-xs text-destructive mt-1">{errors.chiffre_affaires_dernier_ex[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="profession_activite" className={errors.profession_activite ? "text-destructive" : ""}>Activité</Label>
                    <Input
                      id="profession_activite"
                      value={formData.profession_activite}
                      onChange={(e) => setFormData({ ...formData, profession_activite: e.target.value })}
                      className={errors.profession_activite ? "border-destructive" : ""}
                    />
                    {errors.profession_activite && <p className="text-xs text-destructive mt-1">{errors.profession_activite[0]}</p>}
                  </div>
                </>
              )}

              {/* Champs communs */}
              <div>
                <Label className={errors.telephone ? "text-destructive" : ""}>Téléphone</Label>
                {formData.telephone.map((tel, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={tel}
                      onChange={(e) => {
                        const newTelephone = [...formData.telephone];
                        newTelephone[index] = e.target.value;
                        setFormData({ ...formData, telephone: newTelephone });
                      }}
                      className={errors[`telephone.${index}`] ? "border-destructive" : ""}
                      placeholder="Numéro de téléphone"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newTelephone = formData.telephone.filter((_, i) => i !== index);
                        setFormData({ ...formData, telephone: newTelephone });
                      }}
                      disabled={formData.telephone.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, telephone: [...formData.telephone, ''] })}
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un numéro
                </Button>
                {errors.telephone && <p className="text-xs text-destructive mt-1">{errors.telephone[0]}</p>}
              </div>
              <div>
                <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adresse_actuelle" className={errors.adresse_actuelle ? "text-destructive" : ""}>Adresse actuelle</Label>
                <Input
                  id="adresse_actuelle"
                  value={formData.adresse_actuelle}
                  onChange={(e) => setFormData({ ...formData, adresse_actuelle: e.target.value })}
                  className={errors.adresse_actuelle ? "border-destructive" : ""}
                />
                {errors.adresse_actuelle && <p className="text-xs text-destructive mt-1">{errors.adresse_actuelle[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adresse_ar" className={errors.adresse_ar ? "text-destructive" : ""}>Adresse (AR)</Label>
                <Input
                  id="adresse_ar"
                  value={formData.adresse_ar}
                  onChange={(e) => setFormData({ ...formData, adresse_ar: e.target.value })}
                  dir="rtl"
                  className={errors.adresse_ar ? "border-destructive" : ""}
                />
                {errors.adresse_ar && <p className="text-xs text-destructive mt-1">{errors.adresse_ar[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="ville" className={errors.ville ? "text-destructive" : ""}>Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  className={errors.ville ? "border-destructive" : ""}
                />
                {errors.ville && <p className="text-xs text-destructive mt-1">{errors.ville[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adresse_bien_loue" className={errors.adresse_bien_loue ? "text-destructive" : ""}>Adresse du bien loué</Label>
                <Input
                  id="adresse_bien_loue"
                  value={formData.adresse_bien_loue}
                  onChange={(e) => setFormData({ ...formData, adresse_bien_loue: e.target.value })}
                  className={errors.adresse_bien_loue ? "border-destructive" : ""}
                />
                {errors.adresse_bien_loue && <p className="text-xs text-destructive mt-1">{errors.adresse_bien_loue[0]}</p>}
              </div>

              {/* Informations professionnelles - Uniquement pour Personne Physique */}
              {formData.type_personne === 'personne' && (
                <>
                  <div className="md:col-span-2">
                    <Label htmlFor="profession_activite" className={errors.profession_activite ? "text-destructive" : ""}>Profession / Activité</Label>
                    <Input
                      id="profession_activite"
                      value={formData.profession_activite}
                      onChange={(e) => setFormData({ ...formData, profession_activite: e.target.value })}
                      className={errors.profession_activite ? "border-destructive" : ""}
                    />
                    {errors.profession_activite && <p className="text-xs text-destructive mt-1">{errors.profession_activite[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="employeur_denomination" className={errors.employeur_denomination ? "text-destructive" : ""}>Employeur</Label>
                    <Input
                      id="employeur_denomination"
                      value={formData.employeur_denomination}
                      onChange={(e) => setFormData({ ...formData, employeur_denomination: e.target.value })}
                      className={errors.employeur_denomination ? "border-destructive" : ""}
                    />
                    {errors.employeur_denomination && <p className="text-xs text-destructive mt-1">{errors.employeur_denomination[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="employeur_adresse" className={errors.employeur_adresse ? "text-destructive" : ""}>Adresse employeur</Label>
                    <Input
                      id="employeur_adresse"
                      value={formData.employeur_adresse}
                      onChange={(e) => setFormData({ ...formData, employeur_adresse: e.target.value })}
                      className={errors.employeur_adresse ? "border-destructive" : ""}
                    />
                    {errors.employeur_adresse && <p className="text-xs text-destructive mt-1">{errors.employeur_adresse[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="type_contrat" className={errors.type_contrat ? "text-destructive" : ""}>Type de contrat</Label>
                    <Select
                      value={formData.type_contrat}
                      onValueChange={(value) => setFormData({ ...formData, type_contrat: value })}
                    >
                      <SelectTrigger id="type_contrat" className={errors.type_contrat ? "border-destructive" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cdi">CDI</SelectItem>
                        <SelectItem value="cdd">CDD</SelectItem>
                        <SelectItem value="independant">Indépendant</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type_contrat && <p className="text-xs text-destructive mt-1">{errors.type_contrat[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="revenu_mensuel_net" className={errors.revenu_mensuel_net ? "text-destructive" : ""}>Revenu mensuel net</Label>
                    <Input
                      id="revenu_mensuel_net"
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      step="0.01"
                      value={formData.revenu_mensuel_net}
                      onChange={(e) => setFormData({ ...formData, revenu_mensuel_net: e.target.value })}
                      className={errors.revenu_mensuel_net ? "border-destructive" : ""}
                    />
                    {errors.revenu_mensuel_net && <p className="text-xs text-destructive mt-1">{errors.revenu_mensuel_net[0]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="anciennete_mois" className={errors.anciennete_mois ? "text-destructive" : ""}>Ancienneté (mois)</Label>
                    <Input
                      id="anciennete_mois"
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={formData.anciennete_mois}
                      onChange={(e) => setFormData({ ...formData, anciennete_mois: e.target.value })}
                      className={errors.anciennete_mois ? "border-destructive" : ""}
                    />
                    {errors.anciennete_mois && <p className="text-xs text-destructive mt-1">{errors.anciennete_mois[0]}</p>}
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <Label htmlFor="references_locatives" className={errors.references_locatives ? "text-destructive" : ""}>Références locatives</Label>
                <Input
                  id="references_locatives"
                  value={formData.references_locatives}
                  onChange={(e) => setFormData({ ...formData, references_locatives: e.target.value })}
                  className={errors.references_locatives ? "border-destructive" : ""}
                />
                {errors.references_locatives && <p className="text-xs text-destructive mt-1">{errors.references_locatives[0]}</p>}
              </div>

              {/* Statut - Options limitées pour commercial */}
              <div className="md:col-span-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger id="statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isCommercial ? (
                      <>
                        <SelectItem value="en_negociation">En négociation</SelectItem>
                        <SelectItem value="negociation_echouee">Négociation échouée</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="en_negociation">En négociation</SelectItem>
                        <SelectItem value="negociation_echouee">Négociation échouée</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
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
              Êtes-vous sûr de vouloir supprimer le locataire{' '}
              <strong>{selectedLocataire && getDisplayName(selectedLocataire)}</strong> ? Cette action est irréversible.
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
