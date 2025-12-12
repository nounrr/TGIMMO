import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export default function ProprietaireForm({ initialData, onSubmit, onCancel, isSubmitting, serverErrors = {} }) {
  const [formData, setFormData] = useState({
    nom_raison: '',
    nom_ar: '',
    prenom_ar: '',
    type_proprietaire: 'unique',
    statut: 'brouillon',
    telephone: [''],
    email: '',
    rib: '',
    adresse: '',
    adresse_ar: '',
    cin: '',
    rc: '',
    ice: '',
    ifiscale: '',
    ville: '',
    representant_nom: '',
    representant_fonction: '',
    representant_cin: '',
    chiffre_affaires: '',
    taux_gestion: '',
    assiette_honoraires: 'loyers_encaisse',
    periodicite_releve: 'mensuel',
    conditions_particulieres: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom_raison: initialData.nom_raison || '',
        nom_ar: initialData.nom_ar || '',
        prenom_ar: initialData.prenom_ar || '',
        type_proprietaire: initialData.type_proprietaire || 'unique',
        statut: initialData.statut || 'brouillon',
        telephone: Array.isArray(initialData.telephone) ? initialData.telephone : (initialData.telephone ? [initialData.telephone] : ['']),
        email: initialData.email || '',
        rib: initialData.rib || '',
        adresse: initialData.adresse || '',
        adresse_ar: initialData.adresse_ar || '',
        cin: initialData.cin || '',
        rc: initialData.rc || '',
        ice: initialData.ice || '',
        ifiscale: initialData.ifiscale || '',
        ville: initialData.ville || '',
        representant_nom: initialData.representant_nom || '',
        representant_fonction: initialData.representant_fonction || '',
        representant_cin: initialData.representant_cin || '',
        chiffre_affaires: initialData.chiffre_affaires || '',
        taux_gestion: initialData.taux_gestion || '',
        assiette_honoraires: initialData.assiette_honoraires || 'loyers_encaisse',
        periodicite_releve: initialData.periodicite_releve || 'mensuel',
        conditions_particulieres: initialData.conditions_particulieres || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.keys(serverErrors).length > 0 && (
        <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive mb-4">
          <p className="font-bold">Erreurs de validation :</p>
          <ul className="list-disc list-inside">
            {Object.entries(serverErrors).map(([field, msgs]) => (
              <li key={field}>{msgs[0]}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="nom_raison" className={serverErrors.nom_raison ? "text-destructive" : ""}>Nom / Raison sociale *</Label>
          <Input
            id="nom_raison"
            value={formData.nom_raison}
            onChange={(e) => setFormData({ ...formData, nom_raison: e.target.value })}
            required
            className={serverErrors.nom_raison ? "border-destructive" : ""}
          />
          {serverErrors.nom_raison && <p className="text-xs text-destructive mt-1">{serverErrors.nom_raison[0]}</p>}
        </div>
        <div>
          <Label htmlFor="nom_ar" className={serverErrors.nom_ar ? "text-destructive" : ""}>Nom (AR)</Label>
          <Input
            id="nom_ar"
            value={formData.nom_ar}
            onChange={(e) => setFormData({ ...formData, nom_ar: e.target.value })}
            dir="rtl"
            className={serverErrors.nom_ar ? "border-destructive" : ""}
          />
          {serverErrors.nom_ar && <p className="text-xs text-destructive mt-1">{serverErrors.nom_ar[0]}</p>}
        </div>
        <div>
          <Label htmlFor="prenom_ar" className={serverErrors.prenom_ar ? "text-destructive" : ""}>Prénom (AR)</Label>
          <Input
            id="prenom_ar"
            value={formData.prenom_ar}
            onChange={(e) => setFormData({ ...formData, prenom_ar: e.target.value })}
            dir="rtl"
            className={serverErrors.prenom_ar ? "border-destructive" : ""}
          />
          {serverErrors.prenom_ar && <p className="text-xs text-destructive mt-1">{serverErrors.prenom_ar[0]}</p>}
        </div>
        <div>
          <Label htmlFor="type_proprietaire" className={serverErrors.type_proprietaire ? "text-destructive" : ""}>Type de propriétaire</Label>
          <Select
            value={formData.type_proprietaire}
            onValueChange={(value) => setFormData({ ...formData, type_proprietaire: value })}
          >
            <SelectTrigger id="type_proprietaire" className={serverErrors.type_proprietaire ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unique">Propriétaire unique</SelectItem>
              <SelectItem value="coproprietaire">Copropriétaire</SelectItem>
              <SelectItem value="heritier">Héritier</SelectItem>
              <SelectItem value="sci">SCI</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
          {serverErrors.type_proprietaire && <p className="text-xs text-destructive mt-1">{serverErrors.type_proprietaire[0]}</p>}
        </div>
        <div>
          <Label htmlFor="statut" className={serverErrors.statut ? "text-destructive" : ""}>Statut</Label>
          <Select
            value={formData.statut}
            onValueChange={(value) => setFormData({ ...formData, statut: value })}
          >
            <SelectTrigger id="statut" className={serverErrors.statut ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="signe">Signé</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="resilie">Résilié</SelectItem>
              <SelectItem value="en_negociation">En négociation</SelectItem>
            </SelectContent>
          </Select>
          {serverErrors.statut && <p className="text-xs text-destructive mt-1">{serverErrors.statut[0]}</p>}
        </div>
        <div>
          <Label className={serverErrors.telephone ? "text-destructive" : ""}>Téléphone</Label>
          {formData.telephone.map((tel, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                value={tel}
                onChange={(e) => {
                  const newTelephone = [...formData.telephone];
                  newTelephone[index] = e.target.value;
                  setFormData({ ...formData, telephone: newTelephone });
                }}
                className={serverErrors[`telephone.${index}`] ? "border-destructive" : ""}
                placeholder="Numéro de téléphone"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const newTelephone = formData.telephone.filter((_, i) => i !== index);
                  setFormData({ ...formData, telephone: newTelephone });
                }}
                disabled={formData.telephone.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFormData({ ...formData, telephone: [...formData.telephone, ''] })}
            className="mt-1"
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un numéro
          </Button>
          {serverErrors.telephone && <p className="text-xs text-destructive mt-1">{serverErrors.telephone[0]}</p>}
        </div>
        <div>
          <Label htmlFor="email" className={serverErrors.email ? "text-destructive" : ""}>Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={serverErrors.email ? "border-destructive" : ""}
          />
          {serverErrors.email && <p className="text-xs text-destructive mt-1">{serverErrors.email[0]}</p>}
        </div>
        <div>
          <Label htmlFor="rib" className={serverErrors.rib ? "text-destructive" : ""}>RIB</Label>
          <Input
            id="rib"
            value={formData.rib}
            onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
            className={serverErrors.rib ? "border-destructive" : ""}
            placeholder="24 chiffres"
            maxLength={24}
          />
          {serverErrors.rib && <p className="text-xs text-destructive mt-1">{serverErrors.rib[0]}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="adresse" className={serverErrors.adresse ? "text-destructive" : ""}>Adresse</Label>
          <Input
            id="adresse"
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            className={serverErrors.adresse ? "border-destructive" : ""}
          />
          {serverErrors.adresse && <p className="text-xs text-destructive mt-1">{serverErrors.adresse[0]}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="adresse_ar" className={serverErrors.adresse_ar ? "text-destructive" : ""}>Adresse (AR)</Label>
          <Input
            id="adresse_ar"
            value={formData.adresse_ar}
            onChange={(e) => setFormData({ ...formData, adresse_ar: e.target.value })}
            dir="rtl"
            className={serverErrors.adresse_ar ? "border-destructive" : ""}
          />
          {serverErrors.adresse_ar && <p className="text-xs text-destructive mt-1">{serverErrors.adresse_ar[0]}</p>}
        </div>
        <div>
          <Label htmlFor="cin" className={serverErrors.cin ? "text-destructive" : ""}>CIN</Label>
          <Input
            id="cin"
            value={formData.cin}
            onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
            className={serverErrors.cin ? "border-destructive" : ""}
          />
          {serverErrors.cin && <p className="text-xs text-destructive mt-1">{serverErrors.cin[0]}</p>}
        </div>
        <div>
          <Label htmlFor="rc" className={serverErrors.rc ? "text-destructive" : ""}>RC</Label>
          <Input
            id="rc"
            value={formData.rc}
            onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
            className={serverErrors.rc ? "border-destructive" : ""}
          />
          {serverErrors.rc && <p className="text-xs text-destructive mt-1">{serverErrors.rc[0]}</p>}
        </div>
        <div>
          <Label htmlFor="ice" className={serverErrors.ice ? "text-destructive" : ""}>ICE</Label>
          <Input
            id="ice"
            maxLength={15}
            placeholder="15 chiffres"
            value={formData.ice}
            onChange={(e) => setFormData({ ...formData, ice: e.target.value.replace(/\D/g, '') })}
            className={serverErrors.ice ? "border-destructive" : ""}
          />
          {serverErrors.ice && <p className="text-xs text-destructive mt-1">{serverErrors.ice[0]}</p>}
        </div>
        <div>
          <Label htmlFor="ifiscale" className={serverErrors.ifiscale ? "text-destructive" : ""}>Identifiant Fiscal (IF)</Label>
          <Input
            id="ifiscale"
            value={formData.ifiscale}
            onChange={(e) => setFormData({ ...formData, ifiscale: e.target.value })}
            className={serverErrors.ifiscale ? "border-destructive" : ""}
          />
          {serverErrors.ifiscale && <p className="text-xs text-destructive mt-1">{serverErrors.ifiscale[0]}</p>}
        </div>
        <div>
          <Label htmlFor="ville" className={serverErrors.ville ? "text-destructive" : ""}>Ville</Label>
          <Input
            id="ville"
            value={formData.ville}
            onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
            className={serverErrors.ville ? "border-destructive" : ""}
          />
          {serverErrors.ville && <p className="text-xs text-destructive mt-1">{serverErrors.ville[0]}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="representant_nom" className={serverErrors.representant_nom ? "text-destructive" : ""}>Représentant - Nom</Label>
          <Input
            id="representant_nom"
            value={formData.representant_nom}
            onChange={(e) => setFormData({ ...formData, representant_nom: e.target.value })}
            className={serverErrors.representant_nom ? "border-destructive" : ""}
          />
          {serverErrors.representant_nom && <p className="text-xs text-destructive mt-1">{serverErrors.representant_nom[0]}</p>}
        </div>
        <div>
          <Label htmlFor="representant_fonction" className={serverErrors.representant_fonction ? "text-destructive" : ""}>Représentant - Fonction</Label>
          <Input
            id="representant_fonction"
            value={formData.representant_fonction}
            onChange={(e) => setFormData({ ...formData, representant_fonction: e.target.value })}
            className={serverErrors.representant_fonction ? "border-destructive" : ""}
          />
          {serverErrors.representant_fonction && <p className="text-xs text-destructive mt-1">{serverErrors.representant_fonction[0]}</p>}
        </div>
        <div>
          <Label htmlFor="representant_cin" className={serverErrors.representant_cin ? "text-destructive" : ""}>Représentant - CIN</Label>
          <Input
            id="representant_cin"
            value={formData.representant_cin}
            onChange={(e) => setFormData({ ...formData, representant_cin: e.target.value })}
            className={serverErrors.representant_cin ? "border-destructive" : ""}
          />
          {serverErrors.representant_cin && <p className="text-xs text-destructive mt-1">{serverErrors.representant_cin[0]}</p>}
        </div>
        <div>
          <Label htmlFor="chiffre_affaires" className={serverErrors.chiffre_affaires ? "text-destructive" : ""}>Capital Social</Label>
          <Input
            id="chiffre_affaires"
            type="number"
            onWheel={(e) => e.target.blur()}
            step="0.01"
            value={formData.chiffre_affaires}
            onChange={(e) => setFormData({ ...formData, chiffre_affaires: e.target.value })}
            className={serverErrors.chiffre_affaires ? "border-destructive" : ""}
          />
          {serverErrors.chiffre_affaires && <p className="text-xs text-destructive mt-1">{serverErrors.chiffre_affaires[0]}</p>}
        </div>
        <div>
          <Label htmlFor="taux_gestion" className={serverErrors.taux_gestion ? "text-destructive" : ""}>Taux des honoraires</Label>
          <Input
            id="taux_gestion"
            type="number"
            onWheel={(e) => e.target.blur()}
            step="0.01"
            value={formData.taux_gestion}
            onChange={(e) => setFormData({ ...formData, taux_gestion: e.target.value })}
            className={serverErrors.taux_gestion ? "border-destructive" : ""}
          />
          {serverErrors.taux_gestion && <p className="text-xs text-destructive mt-1">{serverErrors.taux_gestion[0]}</p>}
        </div>
        <div>
          <Label htmlFor="assiette_honoraires" className={serverErrors.assiette_honoraires ? "text-destructive" : ""}>Assiette honoraires</Label>
          <Select
            value={formData.assiette_honoraires}
            onValueChange={(value) => setFormData({ ...formData, assiette_honoraires: value })}
          >
            <SelectTrigger id="assiette_honoraires" className={serverErrors.assiette_honoraires ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loyers_encaisse">Loyers encaissés</SelectItem>
              <SelectItem value="loyers_factures">Loyers émis</SelectItem>
            </SelectContent>
          </Select>
          {serverErrors.assiette_honoraires && <p className="text-xs text-destructive mt-1">{serverErrors.assiette_honoraires[0]}</p>}
        </div>
        <div>
          <Label htmlFor="periodicite_releve" className={serverErrors.periodicite_releve ? "text-destructive" : ""}>Périodicité relevé</Label>
          <Select
            value={formData.periodicite_releve}
            onValueChange={(value) => setFormData({ ...formData, periodicite_releve: value })}
          >
            <SelectTrigger id="periodicite_releve" className={serverErrors.periodicite_releve ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensuel">Mensuel</SelectItem>
              <SelectItem value="trimestriel">Trimestriel</SelectItem>
              <SelectItem value="semestriel">Semestriel</SelectItem>
              <SelectItem value="annuel">Annuel</SelectItem>
            </SelectContent>
          </Select>
          {serverErrors.periodicite_releve && <p className="text-xs text-destructive mt-1">{serverErrors.periodicite_releve[0]}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="conditions_particulieres" className={serverErrors.conditions_particulieres ? "text-destructive" : ""}>Conditions particulières</Label>
          <Input
            id="conditions_particulieres"
            value={formData.conditions_particulieres}
            onChange={(e) => setFormData({ ...formData, conditions_particulieres: e.target.value })}
            className={serverErrors.conditions_particulieres ? "border-destructive" : ""}
          />
          {serverErrors.conditions_particulieres && <p className="text-xs text-destructive mt-1">{serverErrors.conditions_particulieres[0]}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full md:w-1/2">
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-1/2">
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}