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

export default function LocataireForm({ initialData, onSubmit, onCancel, isSubmitting, serverErrors = {} }) {
  const [formData, setFormData] = useState({
    type_locataire: 'particulier',
    nom: '',
    prenom: '',
    nom_ar: '',
    prenom_ar: '',
    cin: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: '',
    situation_matrimoniale: 'celibataire',
    profession: '',
    employeur: '',
    salaire_mensuel: '',
    telephone: [''],
    email: '',
    adresse_legale: '',
    ville: '',
    rib: '',
    raison_sociale: '',
    rc: '',
    ice: '',
    ifiscale: '',
    representant_legal: '',
    activite_principale: '',
    capital_social: '',
    siege_social: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type_locataire: initialData.type_locataire || 'particulier',
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        nom_ar: initialData.nom_ar || '',
        prenom_ar: initialData.prenom_ar || '',
        cin: initialData.cin || '',
        date_naissance: initialData.date_naissance || '',
        lieu_naissance: initialData.lieu_naissance || '',
        nationalite: initialData.nationalite || '',
        situation_matrimoniale: initialData.situation_matrimoniale || 'celibataire',
        profession: initialData.profession || '',
        employeur: initialData.employeur || '',
        salaire_mensuel: initialData.salaire_mensuel || '',
        telephone: Array.isArray(initialData.telephone) ? initialData.telephone : (initialData.telephone ? [initialData.telephone] : ['']),
        email: initialData.email || '',
        adresse_legale: initialData.adresse_legale || '',
        ville: initialData.ville || '',
        rib: initialData.rib || '',
        raison_sociale: initialData.raison_sociale || '',
        rc: initialData.rc || '',
        ice: initialData.ice || '',
        ifiscale: initialData.ifiscale || '',
        representant_legal: initialData.representant_legal || '',
        activite_principale: initialData.activite_principale || '',
        capital_social: initialData.capital_social || '',
        siege_social: initialData.siege_social || '',
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
      
      <div>
        <Label htmlFor="type_locataire" className={serverErrors.type_locataire ? "text-destructive" : ""}>Type de locataire</Label>
        <Select
          value={formData.type_locataire}
          onValueChange={(value) => setFormData({ ...formData, type_locataire: value })}
        >
          <SelectTrigger id="type_locataire" className={serverErrors.type_locataire ? "border-destructive" : ""}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="particulier">Particulier</SelectItem>
            <SelectItem value="societe">Société</SelectItem>
          </SelectContent>
        </Select>
        {serverErrors.type_locataire && <p className="text-xs text-destructive mt-1">{serverErrors.type_locataire[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.type_locataire === 'particulier' ? (
          <>
            <div>
              <Label htmlFor="nom" className={serverErrors.nom ? "text-destructive" : ""}>Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                className={serverErrors.nom ? "border-destructive" : ""}
              />
              {serverErrors.nom && <p className="text-xs text-destructive mt-1">{serverErrors.nom[0]}</p>}
            </div>
            <div>
              <Label htmlFor="prenom" className={serverErrors.prenom ? "text-destructive" : ""}>Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
                className={serverErrors.prenom ? "border-destructive" : ""}
              />
              {serverErrors.prenom && <p className="text-xs text-destructive mt-1">{serverErrors.prenom[0]}</p>}
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
              <Label htmlFor="date_naissance" className={serverErrors.date_naissance ? "text-destructive" : ""}>Date de naissance</Label>
              <Input
                id="date_naissance"
                type="date"
                value={formData.date_naissance}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                className={serverErrors.date_naissance ? "border-destructive" : ""}
              />
              {serverErrors.date_naissance && <p className="text-xs text-destructive mt-1">{serverErrors.date_naissance[0]}</p>}
            </div>
            <div>
              <Label htmlFor="lieu_naissance" className={serverErrors.lieu_naissance ? "text-destructive" : ""}>Lieu de naissance</Label>
              <Input
                id="lieu_naissance"
                value={formData.lieu_naissance}
                onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                className={serverErrors.lieu_naissance ? "border-destructive" : ""}
              />
              {serverErrors.lieu_naissance && <p className="text-xs text-destructive mt-1">{serverErrors.lieu_naissance[0]}</p>}
            </div>
            <div>
              <Label htmlFor="nationalite" className={serverErrors.nationalite ? "text-destructive" : ""}>Nationalité</Label>
              <Input
                id="nationalite"
                value={formData.nationalite}
                onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                className={serverErrors.nationalite ? "border-destructive" : ""}
              />
              {serverErrors.nationalite && <p className="text-xs text-destructive mt-1">{serverErrors.nationalite[0]}</p>}
            </div>
            <div>
              <Label htmlFor="situation_matrimoniale" className={serverErrors.situation_matrimoniale ? "text-destructive" : ""}>Situation matrimoniale</Label>
              <Select
                value={formData.situation_matrimoniale}
                onValueChange={(value) => setFormData({ ...formData, situation_matrimoniale: value })}
              >
                <SelectTrigger id="situation_matrimoniale" className={serverErrors.situation_matrimoniale ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celibataire">Célibataire</SelectItem>
                  <SelectItem value="marie">Marié(e)</SelectItem>
                  <SelectItem value="divorce">Divorcé(e)</SelectItem>
                  <SelectItem value="veuf">Veuf(ve)</SelectItem>
                </SelectContent>
              </Select>
              {serverErrors.situation_matrimoniale && <p className="text-xs text-destructive mt-1">{serverErrors.situation_matrimoniale[0]}</p>}
            </div>
            <div>
              <Label htmlFor="profession" className={serverErrors.profession ? "text-destructive" : ""}>Profession</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className={serverErrors.profession ? "border-destructive" : ""}
              />
              {serverErrors.profession && <p className="text-xs text-destructive mt-1">{serverErrors.profession[0]}</p>}
            </div>
            <div>
              <Label htmlFor="employeur" className={serverErrors.employeur ? "text-destructive" : ""}>Employeur</Label>
              <Input
                id="employeur"
                value={formData.employeur}
                onChange={(e) => setFormData({ ...formData, employeur: e.target.value })}
                className={serverErrors.employeur ? "border-destructive" : ""}
              />
              {serverErrors.employeur && <p className="text-xs text-destructive mt-1">{serverErrors.employeur[0]}</p>}
            </div>
            <div>
              <Label htmlFor="salaire_mensuel" className={serverErrors.salaire_mensuel ? "text-destructive" : ""}>Salaire mensuel</Label>
              <Input
                id="salaire_mensuel"
                type="number"
                onWheel={(e) => e.target.blur()}
                step="0.01"
                value={formData.salaire_mensuel}
                onChange={(e) => setFormData({ ...formData, salaire_mensuel: e.target.value })}
                className={serverErrors.salaire_mensuel ? "border-destructive" : ""}
              />
              {serverErrors.salaire_mensuel && <p className="text-xs text-destructive mt-1">{serverErrors.salaire_mensuel[0]}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="md:col-span-2">
              <Label htmlFor="raison_sociale" className={serverErrors.raison_sociale ? "text-destructive" : ""}>Raison sociale *</Label>
              <Input
                id="raison_sociale"
                value={formData.raison_sociale}
                onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                required
                className={serverErrors.raison_sociale ? "border-destructive" : ""}
              />
              {serverErrors.raison_sociale && <p className="text-xs text-destructive mt-1">{serverErrors.raison_sociale[0]}</p>}
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
              <Label htmlFor="representant_legal" className={serverErrors.representant_legal ? "text-destructive" : ""}>Représentant légal</Label>
              <Input
                id="representant_legal"
                value={formData.representant_legal}
                onChange={(e) => setFormData({ ...formData, representant_legal: e.target.value })}
                className={serverErrors.representant_legal ? "border-destructive" : ""}
              />
              {serverErrors.representant_legal && <p className="text-xs text-destructive mt-1">{serverErrors.representant_legal[0]}</p>}
            </div>
            <div>
              <Label htmlFor="activite_principale" className={serverErrors.activite_principale ? "text-destructive" : ""}>Activité principale</Label>
              <Input
                id="activite_principale"
                value={formData.activite_principale}
                onChange={(e) => setFormData({ ...formData, activite_principale: e.target.value })}
                className={serverErrors.activite_principale ? "border-destructive" : ""}
              />
              {serverErrors.activite_principale && <p className="text-xs text-destructive mt-1">{serverErrors.activite_principale[0]}</p>}
            </div>
            <div>
              <Label htmlFor="capital_social" className={serverErrors.capital_social ? "text-destructive" : ""}>Capital social</Label>
              <Input
                id="capital_social"
                type="number"
                onWheel={(e) => e.target.blur()}
                step="0.01"
                value={formData.capital_social}
                onChange={(e) => setFormData({ ...formData, capital_social: e.target.value })}
                className={serverErrors.capital_social ? "border-destructive" : ""}
              />
              {serverErrors.capital_social && <p className="text-xs text-destructive mt-1">{serverErrors.capital_social[0]}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="siege_social" className={serverErrors.siege_social ? "text-destructive" : ""}>Siège social</Label>
              <Input
                id="siege_social"
                value={formData.siege_social}
                onChange={(e) => setFormData({ ...formData, siege_social: e.target.value })}
                className={serverErrors.siege_social ? "border-destructive" : ""}
              />
              {serverErrors.siege_social && <p className="text-xs text-destructive mt-1">{serverErrors.siege_social[0]}</p>}
            </div>
          </>
        )}

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
          <Label htmlFor="adresse_legale" className={serverErrors.adresse_legale ? "text-destructive" : ""}>Adresse légale</Label>
          <Input
            id="adresse_legale"
            value={formData.adresse_legale}
            onChange={(e) => setFormData({ ...formData, adresse_legale: e.target.value })}
            className={serverErrors.adresse_legale ? "border-destructive" : ""}
          />
          {serverErrors.adresse_legale && <p className="text-xs text-destructive mt-1">{serverErrors.adresse_legale[0]}</p>}
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