import { useState, useEffect, useMemo, useRef } from 'react';
import { useMeQuery, useUploadPhotoMutation, useUpdateMeMutation } from '../features/auth/authApi';
import { PERMS } from '../utils/permissionKeys';
import useAuthz from '../hooks/useAuthz';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// Removed checkbox list detailed view

export default function Profile() {
  const { data: me, isFetching } = useMeQuery();
  const { user, roles, permissions } = useAuthz();
  const current = me || user;
  const [uploadPhoto, { isLoading: isUploading }] = useUploadPhotoMutation();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
  const fileRef = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [form, setForm] = useState({ name: '', telephone_interne: '' });
  // No filter/state now (single block display)

  useEffect(() => {
    if (current) {
      setForm({
        name: current.name || '',
        telephone_interne: current.telephone_interne || '',
      });
    }
  }, [current]);

  const fullName = useMemo(() => (current?.name || '').trim() || current?.email || 'Utilisateur', [current]);
  const initials = useMemo(() => {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }, [fullName]);

  const photoUrl = current?.photo_url || null;

  // Group permissions by resource (prefix before first dot)
  const permissionMatrix = useMemo(() => {
    const matrix = {};
    permissions.forEach((p) => {
      const [res, action] = p.split('.');
      if (!matrix[res]) matrix[res] = new Set();
      if (action) matrix[res].add(action);
    });
    return Object.entries(matrix).map(([res, actions]) => ({ resource: res, actions: Array.from(actions).sort() })).sort((a, b) => a.resource.localeCompare(b.resource));
  }, [permissions]);

  // Flatten permissions directly (already effective list from hook)
  const effectiveList = useMemo(() => permissions.slice().sort(), [permissions]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="relative h-32 w-32 rounded-full border bg-white shadow">
            {photoUrl ? (
              <img src={photoUrl} alt={fullName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <div className="h-full w-full rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-4xl font-semibold">
                {initials || (current?.email?.slice(0, 2)?.toUpperCase() || 'U')}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-2 right-2 text-xs"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              {isUploading ? 'Envoi…' : 'Photo'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={async (e) => {
                setUploadError('');
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await uploadPhoto(file).unwrap();
                } catch (err) {
                  setUploadError(err?.data?.message || 'Erreur téléversement');
                } finally {
                  e.target.value = '';
                }
              }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {fullName}
            </CardTitle>
            <CardDescription className="space-y-1">
              {current?.email && <div className="text-sm text-muted-foreground">{current.email}</div>}
              <div className="flex flex-wrap gap-2 pt-2">
                {current?.statut && (
                  <Badge variant={current.statut === 'actif' ? 'default' : 'secondary'}>{current.statut}</Badge>
                )}
                {current?.fonction && <Badge variant="outline">{current.fonction}</Badge>}
                {current?.service && <Badge variant="outline">{current.service}</Badge>}
                {current?.telephone_interne && <Badge variant="outline">Tel int: {current.telephone_interne}</Badge>}
              </div>
              {/* Bouton retiré – affichage direct plus bas */}
            </CardDescription>
          </div>
        </CardHeader>
        {uploadError && (
          <CardContent className="pt-0"><p className="text-sm text-red-600">{uploadError}</p></CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le profil</CardTitle>
          <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSaveError('');
              setSaveSuccess('');
              try {
                const payload = {
                  name: form.name?.trim() || null,
                  telephone_interne: form.telephone_interne || null,
                };
                await updateMe(payload).unwrap();
                setSaveSuccess('Modifications enregistrées');
              } catch (err) {
                setSaveError(err?.data?.message || 'Échec de la mise à jour');
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nom complet</label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Votre nom et prénom"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="telephone_interne" className="text-sm font-medium">Téléphone interne</label>
                <Input
                  id="telephone_interne"
                  value={form.telephone_interne}
                  onChange={(e) => setForm((f) => ({ ...f, telephone_interne: e.target.value }))}
                  placeholder="Extension téléphonique"
                  maxLength={50}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Enregistrement…' : 'Enregistrer'}</Button>
              {saveSuccess && <span className="text-sm text-green-600">{saveSuccess}</span>}
              {saveError && <span className="text-sm text-red-600">{saveError}</span>}
            </div>
            {isFetching && <p className="text-xs text-muted-foreground">Mise à jour des informations…</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions & Rôles</CardTitle>
          <CardDescription>Vue complète (lecture seule)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Rôles</p>
            <div className="flex flex-wrap gap-2">
              {roles.length === 0 && <Badge variant="secondary">Aucun rôle</Badge>}
              {roles.map((r) => <Badge key={r} variant="outline" className="capitalize">{r}</Badge>)}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Permissions groupées</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {permissionMatrix.map(({ resource, actions }) => (
                <div key={resource} className="rounded-md border p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">{resource}</h3>
                    <span className="text-[10px] text-muted-foreground">{actions.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((a) => {
                      const action = a.toLowerCase();
                      const colorClasses =
                        action === 'view' ? 'bg-blue-100 text-blue-700' :
                        action === 'create' ? 'bg-green-100 text-green-700' :
                        action === 'update' ? 'bg-amber-100 text-amber-700' :
                        action === 'delete' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700';
                      return (
                        <Badge
                          key={a}
                          variant="outline"
                          className={`text-[10px] font-medium px-2 py-0.5 border ${colorClasses}`}
                        >
                          {a}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
              {permissionMatrix.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune permission</p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Modifications gérées par l'administration.</p>
        </CardContent>
      </Card>
    </div>
  );
}