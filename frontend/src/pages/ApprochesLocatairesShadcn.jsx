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
import { MessageSquare, Plus, User, Trash2, Filter, RefreshCw, FileText, Pencil, ArrowUpDown } from 'lucide-react';
import { AudioRecorder } from '../components/AudioRecorder';
import { MiniAudioPlayer } from '../components/MiniAudioPlayer';
import { PaginationControl } from '@/components/PaginationControl';
import LocataireFormDialog from '@/components/LocataireFormDialog';

export default function ApprochesLocatairesShadcn() {
  const [filters, setFilters] = useState({ locataire_id: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const queryParams = useMemo(() => ({
    ...filters,
    page,
    per_page: perPage,
    sort_by: sortBy,
    order: sortOrder,
  }), [filters, sortBy, sortOrder, page, perPage]);

  const { data, isLoading } = useGetApprocheLocatairesQuery(queryParams);
  const [createApproche, { isLoading: saving }] = useCreateApprocheLocataireMutation();
  const [updateApproche, { isLoading: updating }] = useUpdateApprocheLocataireMutation();
  const [deleteApproche, { isLoading: isDeleting }] = useDeleteApprocheLocataireMutation();
  
  const [description, setDescription] = useState('');
  const [selectedLocataire, setSelectedLocataire] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [showLocataireDialog, setShowLocataireDialog] = useState(false);
  
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
  const meta = data?.meta || { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 };
  
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
    
    // Validation: Description is required ONLY if no audio is present
    const hasAudio = !!audioBlob || !!existingAudioUrl;
    if (!hasAudio && !description.trim()) {
        alert("Veuillez saisir une description ou enregistrer un audio.");
        return;
    }
    if (!selectedLocataire) {
        alert("Veuillez sélectionner un locataire.");
        return;
    }
    
    const formData = new FormData();
    formData.append('locataire_id', selectedLocataire.value);
    formData.append('description', description || ''); // Allow empty string if audio exists
    if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
    }

    try {
      if (editingId) {
        formData.append('_method', 'PUT');
        await updateApproche({ 
          id: editingId, 
          data: formData 
        }).unwrap();
        setEditingId(null);
      } else {
        await createApproche(formData).unwrap();
      }
      
      setDescription('');
      setSelectedLocataire(null);
      setAudioBlob(null);
      setExistingAudioUrl(null);
      setFormKey(k => k + 1);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
    }
  };

  const handleEdit = (approche) => {
    setEditingId(approche.id);
    setDescription(approche.description || '');
    setExistingAudioUrl(approche.audio_url || null);
    setAudioBlob(null);
    setFormKey(k => k + 1);
    
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
    setAudioBlob(null);
    setExistingAudioUrl(null);
    setFormKey(k => k + 1);
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
              {editingId ? "Modifier prospection" : "Nouvelle prospection"}
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
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
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
                    </div>
                    <Button 
                      type="button" 
                      variant="default" 
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowLocataireDialog(true)}
                      title="Nouveau locataire"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
                    Description {(audioBlob || existingAudioUrl) ? '' : <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={(audioBlob || existingAudioUrl) ? "Description (optionnelle avec audio)..." : "Décrivez prospection commerciale effectuée..."}
                    rows={4}
                  />
                  
                  <div className="pt-2">
                    <Label className="mb-2 block">Enregistrement Audio (Optionnel)</Label>
                    <AudioRecorder 
                        key={formKey}
                        onAudioRecorded={setAudioBlob} 
                        existingAudioUrl={existingAudioUrl}
                        disabled={!can(PERMS.approches.audio)}
                    />
                    {!can(PERMS.approches.audio) && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Vous n'avez pas la permission d'ajouter des enregistrements audio.
                        </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={saving || updating || !selectedLocataire || (!description.trim() && !audioBlob && !existingAudioUrl)}
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
                      {editingId ? "Mettre à jour" : "Ajouter prospection"}
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
            <div className="flex-1 space-y-2">
              <Label>Trier par</Label>
              <div className="flex gap-2">
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_at">Date création</option>
                  <option value="updated_at">Date modification</option>
                  <option value="description">Description</option>
                </select>
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
                    <TableHead className="min-w-[350px]">Description</TableHead>
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
                        <div className="flex flex-col gap-2">
                            {approche.description && (
                                <p className="text-sm">{approche.description}</p>
                            )}
                            {approche.audio_url && (
                                <div className="mt-1">
                                    <MiniAudioPlayer src={approche.audio_url} />
                                </div>
                            )}
                            {!approche.description && !approche.audio_url && (
                                <span className="text-muted-foreground italic">Aucun contenu</span>
                            )}
                        </div>
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

      <LocataireFormDialog 
        open={showLocataireDialog} 
        onOpenChange={setShowLocataireDialog}
        onSuccess={(newLocataire) => {
          const label = newLocataire.type_locataire === 'societe' 
            ? newLocataire.raison_sociale 
            : [newLocataire.prenom, newLocataire.nom].filter(Boolean).join(' ');
            
          setSelectedLocataire({
            value: newLocataire.id,
            label: label || `Locataire #${newLocataire.id}`,
            data: newLocataire
          });
        }}
      />
    </div>
  );
}
