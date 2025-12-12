import React, { useState } from 'react';
import GedUpload from '../components/GedUpload';
import { useGetDocumentsQuery, useDeleteDocumentMutation } from '../features/ged/gedApi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Link as LinkIcon, Search, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useGetMeQuery } from '../api/baseApi';

export default function GedShadcn() {
  const [search, setSearch] = useState('');
  const [openUpload, setOpenUpload] = useState(false);
  const { data, isLoading } = useGetDocumentsQuery({ q: search });
  const [deleteDocument] = useDeleteDocumentMutation();
  const { data: me } = useGetMeQuery();

  const canUpload = Array.isArray(me?.permissions) && me.permissions.includes('ged.upload');
  const canDelete = Array.isArray(me?.permissions) && me.permissions.includes('ged.delete');

  const documents = data?.data || [];

  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      await deleteDocument(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestion Électronique de Documents (GED)</h1>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[320px]"
            />
            <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
          </div>
          {canUpload && (
            <Dialog open={openUpload} onOpenChange={setOpenUpload}>
              <DialogTrigger asChild>
                <Button onClick={() => setOpenUpload(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Uploader des documents
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Uploader des documents</DialogTitle>
                  <DialogDescription>Sélectionnez des fichiers et liez-les aux entités concernées.</DialogDescription>
                </DialogHeader>
                <GedUpload onSuccess={() => setOpenUpload(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documents récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Liens</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow>
                  ) : documents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Aucun document trouvé</TableCell></TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <a href={`${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/storage/${doc.path}`} target="_blank" rel="noreferrer" className="hover:underline">
                            {doc.original_name}
                          </a>
                        </TableCell>
                        <TableCell>{doc.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {doc.unites?.map(u => <Badge key={`u-${u.id}`} variant="outline">Unité {u.numero_unite}</Badge>)}
                            {doc.baux?.map(b => <Badge key={`b-${b.id}`} variant="outline">Bail {b.numero_bail}</Badge>)}
                            {doc.proprietaires?.map(p => <Badge key={`p-${p.id}`} variant="outline">{p.nom_raison || p.nom}</Badge>)}
                            {doc.locataires?.map(l => <Badge key={`l-${l.id}`} variant="outline">{l.raison_sociale || l.nom}</Badge>)}
                            {doc.mandats?.map(m => <Badge key={`m-${m.id}`} variant="outline">Mandat {m.reference || m.id}</Badge>)}
                            {doc.avenants?.map(a => <Badge key={`av-${a.id}`} variant="outline">Avenant {a.reference || a.id}</Badge>)}
                            {doc.interventions?.map(i => <Badge key={`i-${i.id}`} variant="outline">Intervention {i.id}</Badge>)}
                            {doc.devis?.map(d => <Badge key={`d-${d.id}`} variant="outline">Devis {d.numero || d.id}</Badge>)}
                            {doc.factures?.map(f => <Badge key={`f-${f.id}`} variant="outline">Facture {f.numero || f.id}</Badge>)}
                            {doc.reclamations?.map(r => <Badge key={`r-${r.id}`} variant="outline">Réclamation {r.id}</Badge>)}
                            {doc.imputation_charges?.map(ic => <Badge key={`ic-${ic.id}`} variant="outline">Imputation {ic.id}</Badge>)}
                            {doc.approche_proprietaires?.map(ap => <Badge key={`ap-${ap.id}`} variant="outline">Approche Propriétaire {ap.id}</Badge>)}
                            {doc.approche_locataires?.map(al => <Badge key={`al-${al.id}`} variant="outline">Approche Locataire {al.id}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
