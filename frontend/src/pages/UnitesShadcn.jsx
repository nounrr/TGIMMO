import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetUnitesQuery,
  useCreateUniteMutation,
  useUpdateUniteMutation,
  useDeleteUniteMutation,
} from '../features/unites/unitesApi';
import { useGetProprietairesQuery } from '../features/proprietaires/proprietairesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Search, Plus, Edit, Trash2, Home, MapPin, Maximize2, Users, Map as MapIcon, Locate, ArrowUpDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

import { useSelector } from 'react-redux';
import { useMeQuery } from '../features/auth/authApi';

export default function UnitesShadcn() {
  const { can } = useAuthz();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: me } = useMeQuery();
  const { data: proprietairesData } = useGetProprietairesQuery({ per_page: 1000 });
  const proprietaires = proprietairesData?.data || [];
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
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnite, setSelectedUnite] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    numero_unite: '',
    type_unite: 'appartement',
    adresse_complete: '',
    coordonnees_gps: '',
    immeuble: '',
    bloc: '',
    etage: '',
    superficie_m2: '',
    nb_pieces: '',
    nb_sdb: '',
    nb_appartements: '',
    equipements: '',
    mobilier: '',
    statut: 'vacant',
  });

  const [ownersRows, setOwnersRows] = useState([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);

  const addOwnerRow = () => {
    const newRows = [...ownersRows, { proprietaire_id: '', part_numerateur: 1, part_denominateur: ownersRows.length + 1 }];
    const count = newRows.length;
    setOwnersRows(newRows.map(r => ({ ...r, part_numerateur: 1, part_denominateur: count })));
  };

  const removeOwnerRow = (idx) => {
    const filtered = ownersRows.filter((_, i) => i !== idx);
    if (filtered.length === 0) {
       setOwnersRows([]);
       return;
    }
    const count = filtered.length;
    setOwnersRows(filtered.map(r => ({ ...r, part_numerateur: 1, part_denominateur: count })));
  };

  const updateOwnerRow = (idx, field, value) => {
    const updated = ownersRows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setOwnersRows(updated);
  };

  const ownersTotal = useMemo(() => {
    return ownersRows.reduce((acc, row) => {
      const num = parseFloat(row.part_numerateur) || 0;
      const den = parseFloat(row.part_denominateur) || 1;
      return acc + (den > 0 ? num / den : 0);
    }, 0);
  }, [ownersRows]);

  const queryParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    q: searchTerm,
    type_unite: selectedType === 'all' ? undefined : selectedType,
    statut: selectedStatut === 'all' ? undefined : selectedStatut,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [pagination, searchTerm, selectedStatut, selectedType, sortBy, sortDir]);

  const { data, isLoading, isFetching, refetch } = useGetUnitesQuery(queryParams);
  const [createUnite, { isLoading: isCreating }] = useCreateUniteMutation();
  const [updateUnite, { isLoading: isUpdating }] = useUpdateUniteMutation();
  const [deleteUnite, { isLoading: isDeleting }] = useDeleteUniteMutation();

  const openMap = () => {
    setMapSearchQuery('');
    if (formData.coordonnees_gps) {
      const [lat, lng] = formData.coordonnees_gps.split(',').map(c => parseFloat(c.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapPosition({ lat, lng });
      } else {
        setMapPosition({ lat: 33.5731, lng: -7.5898 }); // Default Casablanca
      }
    } else {
      setMapPosition({ lat: 33.5731, lng: -7.5898 }); // Default Casablanca
    }
    setShowMapModal(true);
  };

  const handleMapSearch = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery) return;
    setIsSearchingMap(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        toast({ variant: "destructive", title: "Introuvable", description: "Adresse non trouvée." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la recherche." });
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Erreur", description: "Géolocalisation non supportée par votre navigateur." });
      return;
    }
    setIsSearchingMap(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsSearchingMap(false);
      },
      (error) => {
        console.error(error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de vous localiser." });
        setIsSearchingMap(false);
      }
    );
  };

  const confirmMapSelection = () => {
    if (mapPosition) {
      setFormData({ ...formData, coordonnees_gps: `${mapPosition.lat.toFixed(6)}, ${mapPosition.lng.toFixed(6)}` });
    }
    setShowMapModal(false);
  };

  const handleAdd = () => {
    setSelectedUnite(null);
    setErrors({});
    setOwnersRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
    setFormData({
      numero_unite: '',
      type_unite: 'appartement',
      adresse_complete: '',
      coordonnees_gps: '',
      immeuble: '',
      bloc: '',
      etage: '',
      superficie_m2: '',
      nb_pieces: '',
      nb_sdb: '',
      nb_appartements: '',
      equipements: '',
      mobilier: '',
      statut: isCommercial ? 'en_negociation' : 'vacant',
      proprietaire_id: '', // Note: Backend needs to handle this attachment
    });
    setOwnersRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
    setShowFormModal(true);
  };

  const handleEdit = (unite) => {
    setSelectedUnite(unite);
    setErrors({});
    setFormData({
      numero_unite: unite.numero_unite || '',
      type_unite: unite.type_unite || 'appartement',
      adresse_complete: unite.adresse_complete || '',
      coordonnees_gps: unite.coordonnees_gps || '',
      immeuble: unite.immeuble || '',
      bloc: unite.bloc || '',
      etage: unite.etage || '',
      superficie_m2: unite.superficie_m2 || '',
      nb_pieces: unite.nb_pieces || '',
      nb_sdb: unite.nb_sdb || '',
      nb_appartements: unite.nb_appartements || '',
      equipements: unite.equipements || '',
      mobilier: unite.mobilier || '',
      statut: unite.statut || 'vacant',
      proprietaire_id: '', // We don't load the owner here yet
    });
    setOwnersRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
    setShowFormModal(true);
  };

  const handleDeleteClick = (unite) => {
    setSelectedUnite(unite);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnite) return;
    try {
      await deleteUnite(selectedUnite.id).unwrap();
      toast({ title: "Succès", description: "Unité supprimée avec succès" });
      setShowDeleteModal(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la suppression" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sanitize numeric fields: convert empty strings to null
    const payload = {
      ...formData,
      nb_pieces: formData.nb_pieces === '' ? null : formData.nb_pieces,
      nb_sdb: formData.nb_sdb === '' ? null : formData.nb_sdb,
      nb_appartements: formData.nb_appartements === '' ? null : formData.nb_appartements,
      superficie_m2: formData.superficie_m2 === '' ? null : formData.superficie_m2,
      etage: formData.etage === '' ? null : formData.etage,
      owners: ownersRows.filter(r => r.proprietaire_id),
    };

    try {
      if (selectedUnite) {
        await updateUnite({ id: selectedUnite.id, ...payload }).unwrap();
        toast({ title: "Succès", description: "Unité mise à jour avec succès" });
      } else {
        await createUnite(payload).unwrap();
        toast({ title: "Succès", description: "Unité créée avec succès" });
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
      vacant: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      loue: 'bg-green-100 text-green-700 hover:bg-green-100',
      maintenance: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
      reserve: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
      en_negociation: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    };
    const labels = {
      vacant: 'Vacant',
      loue: 'Loué',
      maintenance: 'Maintenance',
      reserve: 'Réservé',
      en_negociation: 'En négociation',
    };
    return <Badge className={variants[statut] || ''}>{labels[statut] || statut}</Badge>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      appartement: 'Appartement',
      maison: 'Maison',
      bureau: 'Bureau',
      local_commercial: 'Local Commercial',
      garage: 'Garage',
      box: 'Box',
      terrain: 'Terrain',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  if (!can(PERMS.unites.view)) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          Accès refusé: vous n'avez pas la permission de voir les unités.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unités</h1>
          <p className="text-muted-foreground">
            Gérez vos unités immobilières
          </p>
        </div>
        {can(PERMS.unites.create) && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle unité
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une unité..."
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
                <SelectItem value="Appartement">Appartement</SelectItem>
                <SelectItem value="Bureau">Bureau</SelectItem>
                <SelectItem value="Magasin">Magasin</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="loue">Loué</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="reserve">Réservé</SelectItem>
                <SelectItem value="en_negociation">En négociation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('numero_unite')} className="cursor-pointer">
                    N° Unité
                    {sortBy === 'numero_unite' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead onClick={() => handleSort('type_unite')} className="cursor-pointer">
                    Type
                    {sortBy === 'type_unite' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead onClick={() => handleSort('immeuble')} className="cursor-pointer">
                    Immeuble
                    {sortBy === 'immeuble' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead onClick={() => handleSort('statut')} className="cursor-pointer">
                    Statut
                    {sortBy === 'statut' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
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
                      Aucune unité trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((unite) => (
                    <TableRow key={unite.id}>
                      <TableCell className="font-medium">
                        {unite.numero_unite}
                      </TableCell>
                      <TableCell>
                        {getTypeLabel(unite.type_unite)}
                      </TableCell>
                      <TableCell>
                        {unite.immeuble || '-'}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(unite.statut)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/unites/${unite.id}/owners`)}
                            title="Voir propriétaires"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          {can(PERMS.unites.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(unite)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {can(PERMS.unites.create) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(unite)}
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
              {selectedUnite ? 'Modifier l\'unité' : 'Nouvelle unité'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'unité
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
              <div>
                <Label htmlFor="numero_unite" className={errors.numero_unite ? "text-destructive" : ""}>N° Unité *</Label>
                <Input
                  id="numero_unite"
                  value={formData.numero_unite}
                  onChange={(e) => setFormData({ ...formData, numero_unite: e.target.value })}
                  className={errors.numero_unite ? "border-destructive" : ""}
                  required
                />
                {errors.numero_unite && <p className="text-xs text-destructive mt-1">{errors.numero_unite[0]}</p>}
              </div>
              <div>
                <Label htmlFor="type_unite" className={errors.type_unite ? "text-destructive" : ""}>Type d'unité</Label>
                <Select
                  value={formData.type_unite}
                  onValueChange={(value) => setFormData({ ...formData, type_unite: value })}
                >
                  <SelectTrigger id="type_unite" className={errors.type_unite ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Appartement">Appartement</SelectItem>
                    <SelectItem value="Bureau">Bureau</SelectItem>
                    <SelectItem value="Magasin">Magasin</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type_unite && <p className="text-xs text-destructive mt-1">{errors.type_unite[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adresse_complete">Adresse complète</Label>
                <Input
                  id="adresse_complete"
                  value={formData.adresse_complete}
                  onChange={(e) => setFormData({ ...formData, adresse_complete: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="coordonnees_gps">Coordonnées GPS (Google Maps)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="coordonnees_gps"
                    value={formData.coordonnees_gps}
                    onChange={(e) => setFormData({ ...formData, coordonnees_gps: e.target.value })}
                    placeholder="Ex: 33.5731, -7.5898"
                    className="flex-1"
                  />
                  <Button type="button" size="icon" onClick={openMap} title="Choisir sur la carte" className="shrink-0 bg-red-500 hover:bg-red-600 text-white">
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="immeuble">Immeuble</Label>
                <Input
                  id="immeuble"
                  value={formData.immeuble}
                  onChange={(e) => setFormData({ ...formData, immeuble: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bloc">Bloc</Label>
                <Input
                  id="bloc"
                  value={formData.bloc}
                  onChange={(e) => setFormData({ ...formData, bloc: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="etage" className={errors.etage ? "text-destructive" : ""}>Étage</Label>
                  <Input
                    id="etage"
                    value={formData.etage}
                    onChange={(e) => setFormData({ ...formData, etage: e.target.value })}
                    className={errors.etage ? "border-destructive" : ""}
                  />
                  {errors.etage && <p className="text-xs text-destructive mt-1">{errors.etage[0]}</p>}
                </div>
                <div>
                  <Label htmlFor="superficie_m2" className={errors.superficie_m2 ? "text-destructive" : ""}>Surface (m²)</Label>
                  <Input
                    id="superficie_m2"
                    type="number"
                    value={formData.superficie_m2}
                    onChange={(e) => setFormData({ ...formData, superficie_m2: e.target.value })}
                    className={errors.superficie_m2 ? "border-destructive" : ""}
                  />
                  {errors.superficie_m2 && <p className="text-xs text-destructive mt-1">{errors.superficie_m2[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nb_pieces" className={errors.nb_pieces ? "text-destructive" : ""}>Nb Pièces</Label>
                  <Input
                    id="nb_pieces"
                    type="number"
                    value={formData.nb_pieces}
                    onChange={(e) => setFormData({ ...formData, nb_pieces: e.target.value })}
                    className={errors.nb_pieces ? "border-destructive" : ""}
                  />
                  {errors.nb_pieces && <p className="text-xs text-destructive mt-1">{errors.nb_pieces[0]}</p>}
                </div>
                <div>
                  <Label htmlFor="nb_sdb" className={errors.nb_sdb ? "text-destructive" : ""}>Nb SDB</Label>
                  <Input
                    id="nb_sdb"
                    type="number"
                    value={formData.nb_sdb}
                    onChange={(e) => setFormData({ ...formData, nb_sdb: e.target.value })}
                    className={errors.nb_sdb ? "border-destructive" : ""}
                  />
                  {errors.nb_sdb && <p className="text-xs text-destructive mt-1">{errors.nb_sdb[0]}</p>}
                </div>
                <div>
                  <Label htmlFor="nb_appartements" className={errors.nb_appartements ? "text-destructive" : ""}>Nb Apparts</Label>
                  <Input
                    id="nb_appartements"
                    type="number"
                    value={formData.nb_appartements}
                    onChange={(e) => setFormData({ ...formData, nb_appartements: e.target.value })}
                    className={errors.nb_appartements ? "border-destructive" : ""}
                  />
                  {errors.nb_appartements && <p className="text-xs text-destructive mt-1">{errors.nb_appartements[0]}</p>}
                </div>
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
                    {isCommercial ? (
                      <>
                        <SelectItem value="en_negociation">En négociation</SelectItem>
                        <SelectItem value="negociation_echouee">Négociation échouée</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="loue">Loué</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="reserve">Réservé</SelectItem>
                        <SelectItem value="en_negociation">En négociation</SelectItem>
                        <SelectItem value="negociation_echouee">Négociation échouée</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* Owners Management Section */}
              <div className="col-span-2 border rounded-md p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <Label>Propriétaires (Total: {(ownersTotal * 100).toFixed(2)}%)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addOwnerRow}>
                    <Plus className="h-4 w-4 mr-1" /> Ajouter
                  </Button>
                </div>
                
                {Math.abs(ownersTotal - 1) > 0.001 && (
                  <div className="text-xs text-amber-600 mb-2 font-medium">
                    Attention: Le total des parts n'est pas égal à 100%
                  </div>
                )}

                <div className="space-y-2">
                  {ownersRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Select
                          value={row.proprietaire_id}
                          onValueChange={(val) => updateOwnerRow(idx, 'proprietaire_id', val)}
                        >
                          <SelectTrigger className={!row.proprietaire_id ? "border-destructive" : ""}>
                            <SelectValue placeholder="Propriétaire" />
                          </SelectTrigger>
                          <SelectContent>
                            {proprietaires?.map((prop) => (
                              <SelectItem key={prop.id} value={String(prop.id)}>
                                {prop.nom_raison}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Num"
                          value={row.part_numerateur}
                          onChange={(e) => updateOwnerRow(idx, 'part_numerateur', e.target.value)}
                          className="text-center"
                        />
                      </div>
                      <div className="flex items-center text-slate-400">/</div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Den"
                          value={row.part_denominateur}
                          onChange={(e) => updateOwnerRow(idx, 'part_denominateur', e.target.value)}
                          className="text-center"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => removeOwnerRow(idx)}
                        disabled={ownersRows.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
              Êtes-vous sûr de vouloir supprimer l'unité{' '}
              <strong>{selectedUnite?.numero_unite}</strong> ? Cette action est irréversible.
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

      {/* Map Dialog */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] sm:h-[80vh] flex flex-col p-4 gap-4">
          <DialogHeader className="px-0 pt-0">
            <DialogTitle>Choisir l'emplacement</DialogTitle>
            <DialogDescription>
              Recherchez une adresse ou cliquez sur la carte.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2">
            <form onSubmit={handleMapSearch} className="flex-1 flex gap-2">
              <Input 
                placeholder="Rechercher..." 
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="h-9"
              />
              <Button type="submit" disabled={isSearchingMap} size="sm" className="h-9 w-9 p-0">
                {isSearchingMap ? '...' : <Search className="h-4 w-4" />}
              </Button>
            </form>
            <Button variant="outline" onClick={handleLocateMe} title="Me localiser" disabled={isSearchingMap} size="sm" className="h-9 w-9 p-0">
              <Locate className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 w-full relative rounded-md overflow-hidden border min-h-0">
            {showMapModal && (
              <MapContainer 
                center={mapPosition || [33.5731, -7.5898]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={mapPosition} />
                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
              </MapContainer>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 px-0 pb-0">
            <Button variant="outline" onClick={() => setShowMapModal(false)} className="w-full sm:w-auto">Annuler</Button>
            <Button onClick={confirmMapSelection} className="w-full sm:w-auto">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
