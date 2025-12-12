import React, { useState } from 'react';
import { useCreateBailPaiementMutation, useValiderPaiementMutation } from '../api/baseApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const monthNames = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];

export default function PaiementModal({ open, onClose, bail, period }) {
  const [createPaiement] = useCreateBailPaiementMutation();
  const [validerPaiement] = useValiderPaiementMutation();
  const [mode, setMode] = useState('espece');
  const [reference, setReference] = useState('');
  const [chequeImage, setChequeImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const montantDu = bail ? Number(bail.montant_loyer || bail.loyer_total || 0) + Number(bail.charges || 0) : 0;
  const year = period?.year || 0;
  const month = period?.month || 0;

  const endOfMonth = (y, m) => new Date(y, m, 0).toISOString().slice(0, 10);

  // Initialize due date when modal opens
  React.useEffect(() => {
    if (open && period) {
      setDueDate(endOfMonth(period.year, period.month));
    }
  }, [open, period]);

  const resetForm = () => {
    setMode('espece');
    setReference('');
    setChequeImage(null);
    setNotes('');
    setDueDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!bail || !period) return null;

  const submitPayment = async () => {
    if (!bail?.id || !period) return;
    setIsSubmitting(true);
    try {
      // Create payment record
      const created = await createPaiement({
        bailId: bail.id,
        payload: {
          period_month: month,
          period_year: year,
          amount_due: montantDu,
          due_date: dueDate,
          notes: notes || undefined
        }
      }).unwrap();

      const paiementId = created.data.id;

      // Validate payment
      await validerPaiement({
        id: paiementId,
        method: mode,
        reference: reference || undefined,
        cheque_image: mode === 'cheque' ? chequeImage : undefined
      }).unwrap();

      handleClose();
    } catch (error) {
      console.error("Payment failed", error);
      alert('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer le paiement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b">
            <div>
              <div className="text-slate-500">Bail</div>
              <div className="font-medium">{bail.numero_bail || `#${bail.id}`}</div>
            </div>
            <div>
              <div className="text-slate-500">Locataire</div>
              <div className="font-medium">{bail.locataire?.nom || bail.locataire?.raison_sociale || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-slate-500">Période</div>
              <div className="font-medium">{monthNames[month - 1]} {year}</div>
            </div>
            <div>
              <div className="text-slate-500">Montant dû</div>
              <div className="font-medium text-emerald-700">{montantDu} MAD</div>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Date d'échéance</Label>
            <Input 
              type="date" 
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Mode de paiement</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="espece">Espèce</SelectItem>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Référence (optionnel)</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Réf. transaction" />
          </div>
          {mode === 'cheque' && (
            <div className="space-y-1">
              <Label>Photo du chèque</Label>
              <Input type="file" accept="image/*" onChange={e => setChequeImage(e.target.files?.[0] || null)} />
              {chequeImage && <div className="text-[10px] text-slate-500">{chequeImage.name}</div>}
            </div>
          )}
          <div className="space-y-1">
            <Label>Notes (optionnel)</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>Annuler</Button>
            <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={submitPayment} disabled={isSubmitting}>
              {isSubmitting ? 'Traitement...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
