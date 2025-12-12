import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProprietaireForm from './ProprietaireForm';
import { useCreateProprietaireMutation } from '../features/proprietaires/proprietairesApi';
import { useToast } from "@/hooks/use-toast";

export default function ProprietaireFormDialog({ open, onOpenChange, onSuccess }) {
  const [createProprietaire, { isLoading }] = useCreateProprietaireMutation();
  const [serverErrors, setServerErrors] = useState({});
  const { toast } = useToast();

  const handleSubmit = async (formData) => {
    setServerErrors({});
    try {
      const result = await createProprietaire(formData).unwrap();
      toast({
        title: "Succès",
        description: "Propriétaire créé avec succès",
      });
      if (onSuccess) onSuccess(result.data || result); // Handle API response structure
      onOpenChange(false);
    } catch (error) {
      if (error.status === 422) {
        setServerErrors(error.data.errors);
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors de la création",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Propriétaire</DialogTitle>
        </DialogHeader>
        <ProprietaireForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isLoading}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}