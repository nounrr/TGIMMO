import React, { useState } from 'react';
import {
  useGetReclamationTypesQuery,
  useCreateReclamationTypeMutation,
  useUpdateReclamationTypeMutation,
  useDeleteReclamationTypeMutation
} from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tags, Plus, Pencil, Trash2, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

export default function ReclamationTypes() {
  const { can } = useAuthz();
  const { data: types = [], isLoading, isError, refetch, isFetching } = useGetReclamationTypesQuery();
  const [createType] = useCreateReclamationTypeMutation();
  const [updateType] = useUpdateReclamationTypeMutation();
  const [deleteType] = useDeleteReclamationTypeMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', active: true });
  const [submitError, setSubmitError] = useState(null);
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? types.filter(t => {
        const f = filter.toLowerCase();
        return (
          (t.name && t.name.toLowerCase().includes(f)) ||
          (t.description && t.description.toLowerCase().includes(f))
        );
      })
    : types;

  const startCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', active: true });
    setSubmitError(null);
    setOpen(true);
  };

  const startEdit = (type) => {
    setEditing(type);
    setForm({
      name: type.name || '',
      description: type.description || '',
      active: type.active !== false
    });
    setSubmitError(null);
    setOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      if (editing) {
        await updateType({ id: editing.id, payload: form }).unwrap();
      } else {
        await createType(form).unwrap();
      }
      setOpen(false);
      setForm({ name: '', description: '', active: true });
    } catch (err) {
      setSubmitError(err?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Supprimer ce type ?')) return;
    try { await deleteType(id).unwrap(); } catch (err) { alert(err?.data?.message || 'Erreur suppression'); }
  };

  if (!can(PERMS.reclamations.view)) {
    return <div className="p-6 text-red-500">Accès refusé</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
            <Tags className="h-8 w-8 text-indigo-600" />
            Types de réclamations
          </h1>
          <p className="text-slate-500">Catégories utilisées pour classifier les réclamations.</p>
        </div>
        {can(PERMS.reclamations.create) && (
          <Button onClick={startCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Nouveau type
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tags className="h-5 w-5 text-slate-600" /> Liste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="space-y-2 w-full md:w-80">
              <Label>Filtrer (nom ou description)</Label>
              <div className="flex gap-2">
                <Input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Nom ou description..." className="flex-1" />
                {filter && (
                  <Button type="button" variant="outline" onClick={()=>{ setFilter(''); refetch(); }} className="shrink-0" title="Réinitialiser">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {isFetching && !isLoading && (
              <div className="text-xs text-slate-400 flex items-center gap-2"><RefreshCw className="h-3 w-3 animate-spin"/>Actualisation...</div>
            )}
          </div>

          {isLoading ? (
            <div className="py-10 flex items-center justify-center"><div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
          ) : isError ? (
            <div className="py-10 text-center space-y-4">
              <div className="flex flex-col items-center gap-2 text-red-600">
                <AlertCircle className="h-8 w-8" />
                <p>Erreur lors du chargement des types.</p>
              </div>
              <Button variant="outline" onClick={()=>refetch()}>Réessayer</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <p className="text-slate-500">Aucun type trouvé.</p>
              {can(PERMS.reclamations.create) && (
                <Button onClick={startCreate} className="gap-2"><Plus className="h-4 w-4"/>Créer un type</Button>
              )}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold flex items-center gap-2"><Tags className="h-4 w-4 text-indigo-600"/>{t.name}</TableCell>
                      <TableCell className="text-slate-600">{t.description || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.active ? 'bg-green-100 text-green-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                          {t.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {can(PERMS.reclamations.update) && (
                            <Button variant="outline" size="icon" onClick={()=>startEdit(t)} className="h-8 w-8" title="Modifier">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {can(PERMS.reclamations.delete) && (
                            <Button variant="outline" size="icon" onClick={()=>onDelete(t.id)} className="h-8 w-8" title="Supprimer">
                              <Trash2 className="h-4 w-4 text-red-600" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-indigo-600" /> {editing ? 'Modifier le type' : 'Nouveau type de réclamation'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            {submitError && (
              <div className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4"/>{submitError}</div>
            )}
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} required placeholder="Ex: Plomberie" onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} placeholder="Description optionnelle..." onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="active" checked={form.active} onCheckedChange={(val)=>setForm(f=>({...f,active:!!val}))} />
              <Label htmlFor="active" className="cursor-pointer flex items-center gap-2">
                {form.active ? 'Type actif' : 'Type inactif'}
              </Label>
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={()=>setOpen(false)}>Annuler</Button>
              <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                {editing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
