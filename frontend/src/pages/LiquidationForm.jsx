import React, { useState } from 'react';
// Fixed import path for useToast
import { useGetProprietairesQuery, usePreviewLiquidationMutation, useCreateLiquidationMutation } from '../api/baseApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Calculator, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LiquidationForm({ onSuccess, onCancel }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    proprietaire_id: '',
    mois: new Date().getMonth() + 1, // Default to current month
    annee: new Date().getFullYear(),
  });

  const [previewData, setPreviewData] = useState(null);
  
  const { data: propsData } = useGetProprietairesQuery({ per_page: 100 });
  const proprietaires = propsData?.data || [];

  const [previewLiquidation, { isLoading: isPreviewLoading, error: previewError }] = usePreviewLiquidationMutation();
  const [createLiquidation, { isLoading: isCreating, error: createError }] = useCreateLiquidationMutation();

  const handlePreview = async () => {
    try {
      const result = await previewLiquidation(formData).unwrap();
      setPreviewData(result);
    } catch (err) {
      console.error("Preview failed", err);
      // Error is handled by the mutation hook state
    }
  };

  const handleCreate = async () => {
    if (!previewData) return;
    try {
      await createLiquidation(formData).unwrap();
      toast({
        title: "Succès",
        description: "La liquidation a été créée avec succès.",
        variant: "default",
      });
      onSuccess();
    } catch (err) {
      console.error("Creation failed", err);
      toast({
        title: "Erreur",
        description: err.data?.message || "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    }
  };

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Propriétaire</Label>
          <Select 
            value={formData.proprietaire_id} 
            onValueChange={(v) => {
              setFormData(prev => ({ ...prev, proprietaire_id: v }));
              setPreviewData(null); // Reset preview on change
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un propriétaire" />
            </SelectTrigger>
            <SelectContent>
              {proprietaires.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nom} {p.prenom} {p.raison_sociale ? `(${p.raison_sociale})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mois</Label>
          <Select 
            value={String(formData.mois)} 
            onValueChange={(v) => {
              setFormData(prev => ({ ...prev, mois: parseInt(v) }));
              setPreviewData(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Année</Label>
          <Input 
            type="number" 
            value={formData.annee} 
            onChange={(e) => {
              setFormData(prev => ({ ...prev, annee: parseInt(e.target.value) }));
              setPreviewData(null);
            }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handlePreview} 
          disabled={!formData.proprietaire_id || isPreviewLoading}
          variant="secondary"
          className="gap-2"
        >
          {isPreviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          Calculer l'aperçu
        </Button>
      </div>

      {previewError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {previewError.data?.message || "Impossible de calculer la liquidation."}
          </AlertDescription>
        </Alert>
      )}

      {previewData && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-500">Total Loyer</p>
                  <p className="text-xl font-bold text-slate-900">{Number(previewData.total_loyer).toFixed(2)} MAD</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Charges</p>
                  <p className="text-xl font-bold text-red-600">-{Number(previewData.total_charges).toFixed(2)} MAD</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Honoraires</p>
                  <p className="text-xl font-bold text-orange-600">-{Number(previewData.total_honoraires).toFixed(2)} MAD</p>
                </div>
                <div className="bg-green-50 rounded-lg py-1">
                  <p className="text-sm text-green-700 font-medium">Net à Verser</p>
                  <p className="text-2xl font-bold text-green-700">{Number(previewData.montant_net).toFixed(2)} MAD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {previewData.details?.charges?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-slate-700">Détail des charges déduites</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.details.charges.map((charge, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{charge.type}</TableCell>
                        <TableCell>{charge.description}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          -{Number(charge.montant).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>Annuler</Button>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2 bg-green-600 hover:bg-green-700">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Valider la liquidation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
