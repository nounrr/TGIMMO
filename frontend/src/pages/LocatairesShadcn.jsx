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

import { useSelector } from 'react-redux';
import { useMeQuery } from '../features/auth/authApi';

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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
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
    telephone: '',
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
    statut: 'actif',
  });

  const queryParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    q: searchTerm,
    type: selectedType === 'all' ? undefined : selectedType,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [pagination, searchTerm, selectedType, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const { data, isLoading, isFetching, refetch } = useGetLocatairesQuery(queryParams);
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
      telephone: '',
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
      telephone: locataire.telephone || '',
      email: locataire.email || '',
      adresse_actuelle: locataire.adresse_actuelle || '',
      adresse_ar: locataire.adresse_ar || '',
      cin: locataire.cin || '',
      rc: locataire.rc || '',
      ice: locataire.ice || '',
      date_naissance: locataire.date_naissance || '',
      lieu_naissance: locataire.lieu_naissance || '',
      date_creation_entreprise: locataire.date_creation_entreprise || '',
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
                      Aucun locataire trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((locataire) => (
                    <TableRow key={locataire.id}>
                      <TableCell className="font-medium">
                        {getDisplayName(locataire)}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(locataire.type_personne)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={locataire.statut === 'actif' ? 'success' : 'secondary'}>
                          {locataire.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {locataire.telephone || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {locataire.email || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
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
                    <Label htmlFor="nom_ar">Nom (AR)</Label>
                    <Input
                      id="nom_ar"
                      value={formData.nom_ar}
                      onChange={(e) => setFormData({ ...formData, nom_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_naissance">Date de naissance</Label>
                    <Input
                      id="date_naissance"
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                    <Input
                      id="lieu_naissance"
                      value={formData.lieu_naissance}
                      onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationalite">Nationalité</Label>
                    <Input
                      id="nationalite"
                      value={formData.nationalite}
                      onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="situation_familiale">Situation familiale</Label>
                    <Select
                      value={formData.situation_familiale}
                      onValueChange={(value) => setFormData({ ...formData, situation_familiale: value })}
                    >
                      <SelectTrigger id="situation_familiale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celibataire">Célibataire</SelectItem>
                        <SelectItem value="marie">Marié(e)</SelectItem>
                        <SelectItem value="divorce">Divorcé(e)</SelectItem>
                        <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nb_personnes_foyer">Nombre de personnes au foyer</Label>
                    <Input
                      id="nb_personnes_foyer"
                      type="number"
                      value={formData.nb_personnes_foyer}
                      onChange={(e) => setFormData({ ...formData, nb_personnes_foyer: e.target.value })}
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
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <Label htmlFor="raison_sociale">Raison sociale *</Label>
                    <Input
                      id="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_creation_entreprise">Date de création</Label>
                    <Input
                      id="date_creation_entreprise"
                      type="date"
                      value={formData.date_creation_entreprise}
                      onChange={(e) => setFormData({ ...formData, date_creation_entreprise: e.target.value })}
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
                    <Label htmlFor="ifiscale">Identifiant Fiscal</Label>
                    <Input
                      id="ifiscale"
                      value={formData.ifiscale}
                      onChange={(e) => setFormData({ ...formData, ifiscale: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chiffre_affaires_dernier_ex">Chiffre d'affaires</Label>
                    <Input
                      id="chiffre_affaires_dernier_ex"
                      type="number"
                      step="0.01"
                      value={formData.chiffre_affaires_dernier_ex}
                      onChange={(e) => setFormData({ ...formData, chiffre_affaires_dernier_ex: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercice_annee">Année d'exercice</Label>
                    <Input
                      id="exercice_annee"
                      type="number"
                      value={formData.exercice_annee}
                      onChange={(e) => setFormData({ ...formData, exercice_annee: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Champs communs */}
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
                <Label htmlFor="adresse_actuelle">Adresse actuelle</Label>
                <Input
                  id="adresse_actuelle"
                  value={formData.adresse_actuelle}
                  onChange={(e) => setFormData({ ...formData, adresse_actuelle: e.target.value })}
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
              <div className="md:col-span-2">
                <Label htmlFor="adresse_bien_loue">Adresse du bien loué</Label>
                <Input
                  id="adresse_bien_loue"
                  value={formData.adresse_bien_loue}
                  onChange={(e) => setFormData({ ...formData, adresse_bien_loue: e.target.value })}
                />
              </div>

              {/* Informations professionnelles */}
              <div className="md:col-span-2">
                <Label htmlFor="profession_activite">Profession / Activité</Label>
                <Input
                  id="profession_activite"
                  value={formData.profession_activite}
                  onChange={(e) => setFormData({ ...formData, profession_activite: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="employeur_denomination">Employeur</Label>
                <Input
                  id="employeur_denomination"
                  value={formData.employeur_denomination}
                  onChange={(e) => setFormData({ ...formData, employeur_denomination: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="employeur_adresse">Adresse employeur</Label>
                <Input
                  id="employeur_adresse"
                  value={formData.employeur_adresse}
                  onChange={(e) => setFormData({ ...formData, employeur_adresse: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type_contrat">Type de contrat</Label>
                <Select
                  value={formData.type_contrat}
                  onValueChange={(value) => setFormData({ ...formData, type_contrat: value })}
                >
                  <SelectTrigger id="type_contrat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cdi">CDI</SelectItem>
                    <SelectItem value="cdd">CDD</SelectItem>
                    <SelectItem value="independant">Indépendant</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="revenu_mensuel_net">Revenu mensuel net</Label>
                <Input
                  id="revenu_mensuel_net"
                  type="number"
                  step="0.01"
                  value={formData.revenu_mensuel_net}
                  onChange={(e) => setFormData({ ...formData, revenu_mensuel_net: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="anciennete_mois">Ancienneté (mois)</Label>
                <Input
                  id="anciennete_mois"
                  type="number"
                  value={formData.anciennete_mois}
                  onChange={(e) => setFormData({ ...formData, anciennete_mois: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="references_locatives">Références locatives</Label>
                <Input
                  id="references_locatives"
                  value={formData.references_locatives}
                  onChange={(e) => setFormData({ ...formData, references_locatives: e.target.value })}
                />
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
