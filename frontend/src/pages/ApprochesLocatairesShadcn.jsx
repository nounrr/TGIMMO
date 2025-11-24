import { useMemo, useState } from 'react';
import Select from 'react-select';
import { 
  useGetApprocheLocatairesQuery, 
  useCreateApprocheLocataireMutation, 
  useUpdateApprocheLocataireMutation, 
  useDeleteApprocheLocataireMutation 
} from '../api/baseApi';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, User, Trash2, Filter, RefreshCw, FileText, Pencil } from 'lucide-react';

export default function ApprochesLocatairesShadcn() {
  const [filters, setFilters] = useState({ locataire_id: '' });
  const { data, isLoading } = useGetApprocheLocatairesQuery(filters);
  const [createApproche, { isLoading: saving }] = useCreateApprocheLocataireMutation();
  const [updateApproche, { isLoading: updating }] = useUpdateApprocheLocataireMutation();
  const [deleteApproche, { isLoading: isDeleting }] = useDeleteApprocheLocataireMutation();
  
  const [description, setDescription] = useState('');
  const [selectedLocataire, setSelectedLocataire] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [filterLocataire, setFilterLocataire] = useState(null);
  const { can, permissions, user } = useAuthz();

  // Debug permissions (render-time). Retirer en production si inutile.
  if (typeof window !== 'undefined') {
    console.debug('[DEBUG ApprochesLocataires] perms check', {
      userId: user?.id,
      needed: PERMS.approches_locataires.create,
      canCreate: can(PERMS.approches_locataires.create),
      permissions,
    });
  }
  
  // Charger tous les locataires pour le select
  const { data: locatairesData } = useGetLocatairesQuery({ per_page: 1000 });
  const locataires = locatairesData?.data || [];
  
  const approches = data?.data || [];
  
  // Options pour react-select
  const locataireOptions = locataires.map(loc => ({
    value: loc.id,
    label: loc.type_personne === 'personne'
      ? `${loc.prenom || ''} ${loc.nom || ''}`.trim() || `Locataire #${loc.id}`
      : loc.raison_sociale || `Locataire #${loc.id}`,
    data: loc
  }));

  const onChange = (field, value) => setFilters(f => ({ ...f, [field]: value }));

  const locataireLabelById = useMemo(() => {
    const getLabel = (loc) => loc.type_personne === 'personne'
      ? `${loc.prenom || ''} ${loc.nom || ''}`.trim() || `Locataire #${loc.id}`
      : loc.raison_sociale || `Locataire #${loc.id}`;
    const map = {};
    for (const l of locataires) map[l.id] = getLabel(l);
    return map;
  }, [locataires]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !selectedLocataire) return;
    
    try {
      if (editingId) {
        await updateApproche({ 
          id: editingId, 
          locataire_id: selectedLocataire.value, 
          description 
        }).unwrap();
        setEditingId(null);
      } else {
        await createApproche({ 
          locataire_id: selectedLocataire.value, 
          description 
        }).unwrap();
      }
      
      setDescription('');
      setSelectedLocataire(null);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
    }
  };

  const handleEdit = (approche) => {
    setEditingId(approche.id);
    setDescription(approche.description || '');
    
    // Trouver l'option correspondante pour le select
    const locOption = locataireOptions.find(opt => opt.value === approche.locataire_id);
    if (locOption) {
      setSelectedLocataire(locOption);
    }
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setSelectedLocataire(null);
  };
  
  // Styles personnalisés pour react-select pour matcher shadcn
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.375rem', // rounded-md
      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
      '&:hover': {
        borderColor: 'hsl(var(--ring))'
      },
      minHeight: '2.5rem', // h-10
      fontSize: '0.875rem', // text-sm
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      border: '1px solid hsl(var(--border))',
      zIndex: 50
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'hsl(var(--primary))' : state.isFocused ? 'hsl(var(--accent))' : 'transparent',
      color: state.isSelected ? 'hsl(var(--primary-foreground))' : state.isFocused ? 'hsl(var(--accent-foreground))' : 'inherit',
      cursor: 'pointer',
      fontSize: '0.875rem',
    })
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          Approches Locataires
        </h1>
        <p className="text-slate-500">Gérer les approches commerciales pour vos locataires</p>
      </div>

      {/* Info si absence permission création */}
      {!can(PERMS.approches_locataires.create) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3 text-sm text-amber-700">
            Vous pouvez consulter les approches mais vous n'avez pas la permission de créer une nouvelle entrée.
            Permission requise: <code>{PERMS.approches_locataires.create}</code>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(can(PERMS.approches_locataires.create) || (editingId && can(PERMS.approches_locataires.update))) && (
        <Card className={editingId ? "border-primary/50 ring-1 ring-primary/20" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5" />}
              {editingId ? "Modifier l'approche" : "Nouvelle approche"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <User className="h-4 w-4 text-primary" />
                    Locataire <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedLocataire}
                    onChange={setSelectedLocataire}
                    options={locataireOptions}
                    styles={customSelectStyles}
                    placeholder="Rechercher un locataire..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "Aucun locataire trouvé"}
                    loadingMessage={() => "Chargement..."}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {selectedLocataire && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-md flex items-center gap-2 border">
                      <div className="bg-primary/10 rounded-full p-2 h-8 w-8 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold">{selectedLocataire.label}</div>
                        {selectedLocataire.data?.email && (
                          <div className="text-muted-foreground flex items-center gap-1">
                            <span className="text-xs">{selectedLocataire.data.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-info" />
                    Description de l'approche <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez l'approche commerciale effectuée..."
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={saving || updating || !selectedLocataire || !description.trim()}
                  className="gap-2"
                >
                  {saving || updating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {editingId ? "Modification..." : "Ajout en cours..."}
                    </>
                  ) : (
                    <>
                      {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {editingId ? "Mettre à jour" : "Ajouter l'approche"}
                    </>
                  )}
                </Button>
                
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving || updating}
                    className="gap-2"
                  >
                    Annuler
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedLocataire(null);
                      setDescription('');
                    }}
                    disabled={saving}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table avec filtres intégrés */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <Label className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filtrer par Locataire
              </Label>
              <Select
                value={filterLocataire}
                onChange={(selected) => {
                  setFilterLocataire(selected);
                  onChange('locataire_id', selected ? selected.value : '');
                }}
                options={locataireOptions}
                styles={customSelectStyles}
                placeholder="Rechercher un locataire..."
                isClearable
                isSearchable
                noOptionsMessage={() => "Aucun locataire trouvé"}
                loadingMessage={() => "Chargement..."}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => {
                  setFilters({ locataire_id: '' });
                  setFilterLocataire(null);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Chargement des approches...</p>
            </div>
          ) : approches.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
              <div className="bg-primary/10 rounded-full p-4 h-16 w-16 mx-auto mb-3 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Aucune approche trouvée</h3>
              <p className="text-muted-foreground">
                {filters.locataire_id ? 'Aucune approche pour ce locataire' : 'Commencez par filtrer par locataire'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approches.map(approche => (
                    <TableRow key={approche.id}>
                      <TableCell className="font-medium text-muted-foreground">#{approche.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 rounded-full p-2 h-8 w-8 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{locataireLabelById[approche.locataire_id] || `Locataire #${approche.locataire_id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {approche.description || <span className="text-muted-foreground italic">Aucune description</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {can(PERMS.approches_locataires.update) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 text-blue-500"
                              onClick={() => handleEdit(approche)}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {can(PERMS.approches_locataires.delete) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-red-500"
                              disabled={isDeleting}
                              onClick={() => {
                                if (window.confirm("Supprimer cette approche définitivement ?")) deleteApproche(approche.id);
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
