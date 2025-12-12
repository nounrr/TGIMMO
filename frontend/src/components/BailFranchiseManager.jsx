import { useState } from 'react';
import { Plus, Trash2, Calendar, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useGetBailFranchisesQuery,
  useCreateFranchiseMutation,
  useUpdateFranchiseMutation,
  useDeleteFranchiseMutation,
} from '@/api/baseApi';

export default function BailFranchiseManager({ bailId }) {
  const { data: franchises = [], isLoading } = useGetBailFranchisesQuery(bailId);
  const [createFranchise, { isLoading: isCreating }] = useCreateFranchiseMutation();
  const [updateFranchise, { isLoading: isUpdating }] = useUpdateFranchiseMutation();
  const [deleteFranchise, { isLoading: isDeleting }] = useDeleteFranchiseMutation();

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    pourcentage_remise: '',
    motif: '',
  });

  const resetForm = () => {
    setFormData({
      date_debut: '',
      date_fin: '',
      pourcentage_remise: '',
      motif: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (franchise) => {
    setFormData({
      date_debut: franchise.date_debut || '',
      date_fin: franchise.date_fin || '',
      pourcentage_remise: franchise.pourcentage_remise || '',
      motif: franchise.motif || '',
    });
    setEditingId(franchise.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.date_debut || !formData.date_fin) {
      setError('Les dates de début et fin sont obligatoires');
      return;
    }

    const pourcentage = parseFloat(formData.pourcentage_remise);
    if (isNaN(pourcentage) || pourcentage < 0 || pourcentage > 100) {
      setError('Le pourcentage doit être entre 0 et 100');
      return;
    }

    if (new Date(formData.date_debut) > new Date(formData.date_fin)) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }

    const payload = {
      ...formData,
      bail_id: bailId,
    };

    try {
      if (editingId) {
        await updateFranchise({ id: editingId, payload }).unwrap();
      } else {
        await createFranchise(payload).unwrap();
      }
      resetForm();
    } catch (err) {
      if (err.data?.message) {
        setError(err.data.message);
      } else {
        setError('Une erreur est survenue');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette période de franchise ?')) return;
    try {
      await deleteFranchise(id).unwrap();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  if (isLoading) return <div className="text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Périodes de franchise
        </h3>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter une franchise
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? 'Modifier la franchise' : 'Nouvelle franchise'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_debut">Date début *</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_fin">Date fin *</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pourcentage_remise">Pourcentage de remise (0-100%) *</Label>
                <Input
                  id="pourcentage_remise"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.pourcentage_remise}
                  onChange={(e) => setFormData({ ...formData, pourcentage_remise: e.target.value })}
                  placeholder="Ex: 50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="motif">Motif</Label>
                <Textarea
                  id="motif"
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                  placeholder="Raison de cette franchise (optionnel)"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1"
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isCreating || isUpdating}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {franchises.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <Percent className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Aucune période de franchise définie</p>
          <p className="text-sm mt-1">Les franchises permettent d'appliquer une remise temporaire sur le loyer</p>
        </div>
      )}

      {franchises.length > 0 && (
        <div className="space-y-2">
          {franchises.map((franchise) => (
            <Card key={franchise.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(franchise.date_debut).toLocaleDateString('fr-FR')}
                          {' → '}
                          {new Date(franchise.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-green-600">
                        <Percent className="h-4 w-4" />
                        <span>{franchise.pourcentage_remise}% de remise</span>
                      </div>
                    </div>
                    {franchise.motif && (
                      <p className="text-sm text-gray-600 italic">{franchise.motif}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(franchise)}
                      disabled={isDeleting}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(franchise.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
