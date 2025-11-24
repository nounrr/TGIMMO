import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  useCreateImputationChargeMutation, 
  useUpdateImputationChargeMutation,
  useGetUnitesQuery,
  useGetUniteQuery,
  useGetProprietairesQuery,
  useGetProprietaireQuery,
  useGetBauxQuery,
  useGetBailQuery,
  useGetInterventionsQuery,
  useGetInterventionQuery,
  useGetReclamationsQuery,
  useGetReclamationQuery
} from '../api/baseApi';
import { useGetLocatairesQuery, useGetLocataireQuery } from '../features/locataires/locatairesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useAuthz from '@/hooks/useAuthz';
import { DialogFooter } from '@/components/ui/dialog';

// Helper to get list from paginated response or array
const getList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ChargeForm({ initialData, onSuccess, onCancel }) {
  const defaultValues = {
    montant: '',
    impute_a: 'bail',
    id_impute: '',
    payer_type: 'proprietaire',
    payer_id: '',
    titre: '',
    notes: ''
  };

  // 🔹 Construire les valeurs à partir de initialData
  const buildFormValues = (data) => {
    if (!data) return defaultValues;
    return {
      montant: data.montant ? String(data.montant) : '',
      impute_a: (data.impute_a || 'bail').toLowerCase(),
      id_impute: data.id_impute ? String(data.id_impute) : '',
      payer_type: (data.payer_type || 'proprietaire').toLowerCase(),
      payer_id: data.payer_id ? String(data.payer_id) : '',
      titre: data.titre || '',
      notes: data.notes || ''
    };
  };

  // ❌ on enlève "values:" (mode contrôlé)
  const { register, handleSubmit, control, watch, setValue, reset } = useForm({
    defaultValues: buildFormValues(initialData),
  });

  // 🔹 IMPORTANT : reset quand initialData change
  useEffect(() => {
    reset(buildFormValues(initialData));
  }, [initialData, reset]);

  const { toast } = useToast();
  const { can } = useAuthz();
  const [createCharge, { isLoading: isCreating }] = useCreateImputationChargeMutation();
  const [updateCharge, { isLoading: isUpdating }] = useUpdateImputationChargeMutation();

  const canCreate = can('charges.create');
  const canUpdate = can('charges.update');
  const isAllowed = initialData ? canUpdate : canCreate;

  const imputeA = watch('impute_a');
  const payerType = watch('payer_type');
  const currentIdImpute = watch('id_impute');
  const currentPayerId = watch('payer_id');

  // --- Fetch Lists ---
  const { data: unitesData } = useGetUnitesQuery({ per_page: 100 });
  const { data: propsData } = useGetProprietairesQuery({ per_page: 100 });
  const { data: bauxData } = useGetBauxQuery({ per_page: 200 });
  const { data: locsData } = useGetLocatairesQuery({ per_page: 100 });
  const { data: interventionsData } = useGetInterventionsQuery({ per_page: 100 });
  const { data: reclamationsData } = useGetReclamationsQuery({ per_page: 100 });

  const getInitialId = (typeField, typeValue, idField) => {
    if (!initialData) return null;
    if ((initialData[typeField] || '').toLowerCase() === typeValue) {
      return initialData[idField] ? String(initialData[idField]) : null;
    }
    return null;
  };

  const initBailId = getInitialId('impute_a', 'bail', 'id_impute');
  const { data: singleBail } = useGetBailQuery(initBailId, { skip: !initBailId });

  const initUniteId = getInitialId('impute_a', 'unite', 'id_impute');
  const { data: singleUnite } = useGetUniteQuery(initUniteId, { skip: !initUniteId });

  const initInterventionId = getInitialId('impute_a', 'intervention', 'id_impute');
  const { data: singleIntervention } = useGetInterventionQuery(initInterventionId, { skip: !initInterventionId });

  const initReclamationId = getInitialId('impute_a', 'reclamation', 'id_impute');
  const { data: singleReclamation } = useGetReclamationQuery(initReclamationId, { skip: !initReclamationId });

  const initLocImputeId = getInitialId('impute_a', 'locataire', 'id_impute');
  const initLocPayerId = getInitialId('payer_type', 'locataire', 'payer_id');
  const { data: singleLocImpute } = useGetLocataireQuery(initLocImputeId, { skip: !initLocImputeId });
  const { data: singleLocPayer } = useGetLocataireQuery(initLocPayerId, { skip: !initLocPayerId });

  const initPropImputeId = getInitialId('impute_a', 'proprietaire', 'id_impute');
  const initPropPayerId = getInitialId('payer_type', 'proprietaire', 'payer_id');
  const { data: singlePropImpute } = useGetProprietaireQuery(initPropImputeId, { skip: !initPropImputeId });
  const { data: singlePropPayer } = useGetProprietaireQuery(initPropPayerId, { skip: !initPropPayerId });

  const mergeList = (mainList, ...singles) => {
    let list = [...getList(mainList)];
    singles.forEach(s => {
      const item = s?.data || s;
      if (item && item.id && !list.find(x => String(x.id) === String(item.id))) {
        list.push(item);
      }
    });
    return list;
  };

  const baux = mergeList(bauxData, singleBail);
  const unites = mergeList(unitesData, singleUnite);
  const interventions = mergeList(interventionsData, singleIntervention);
  const reclamations = mergeList(reclamationsData, singleReclamation);
  const locataires = mergeList(locsData, singleLocImpute, singleLocPayer);
  const proprietaires = mergeList(propsData, singlePropImpute, singlePropPayer);

  const formatProp = useMemo(
    () => (p) => {
      if (!p) return '';
      // Use nom_raison if available (new schema), else fallback to nom/prenom
      if (p.nom_raison) return p.nom_raison;
      const parts = [p.nom, p.prenom].filter(Boolean);
      let base = parts.join(' ').trim();
      if (!base) base = p.raison_sociale || p.nom_ar || p.prenom_ar || `#${p.id}`;
      return base;
    },
    []
  );

  const formatLoc = useMemo(
    () => (l) => {
      if (!l) return '';
      const parts = [l.nom, l.prenom].filter(Boolean);
      let base = parts.join(' ').trim();
      if (!base) base = l.nom_ar || l.prenom_ar || `#${l.id}`;
      return base;
    },
    []
  );

  const onSubmit = async (data) => {
    if (!isAllowed) {
      toast({ variant: "destructive", title: "Accès refusé", description: "Vous n'avez pas la permission nécessaire." });
      return;
    }

    const payload = {
      montant: parseFloat(data.montant),
      impute_a: data.impute_a,
      id_impute: data.id_impute || null,
      payer_type: data.payer_type,
      payer_id: data.payer_type === 'societe' ? null : (data.payer_id || null),
      titre: data.titre || null,
      notes: data.notes || null,
    };

    try {
      if (initialData) {
        await updateCharge({ id: initialData.id, payload }).unwrap();
        toast({ title: "Succès", description: "Charge mise à jour" });
      } else {
        await createCharge(payload).unwrap();
        toast({ title: "Succès", description: "Charge créée" });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Montant (MAD)</Label>
          <Input
            type="number"
            step="0.01"
            {...register('montant', { required: true })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Type cible (impute_a)</Label>
          <Controller
            name="impute_a"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(v) => { field.onChange(v); setValue('id_impute', ''); }}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bail">Bail</SelectItem>
                  <SelectItem value="unite">Unité</SelectItem>
                  <SelectItem value="intervention">Intervention</SelectItem>
                  <SelectItem value="reclamation">Réclamation</SelectItem>
                  <SelectItem value="locataire">Locataire</SelectItem>
                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                  <SelectItem value="charge_libre">Charge Libre</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {imputeA !== 'charge_libre' && (
        <div className="space-y-2">
          <Label>Objet (id_impute)</Label>
          <Controller
            key={imputeA}
            name="id_impute"
            control={control}
            render={({ field }) => {
              let options = [];
              switch (imputeA) {
                case 'bail':
                  options = [...baux]
                    .sort((a, b) => String(a.numero_bail || '').localeCompare(String(b.numero_bail || '')))
                    .map((b) => ({ id: b.id, label: (b.numero_bail || `#${b.id}`) }));
                  break;
                case 'unite':
                  options = unites.map((u) => ({
                    id: u.id,
                    label: `${u.numero_unite || u.code || '#'+u.id}`
                  }));
                  break;
                case 'locataire':
                  options = locataires.map((l) => ({ id: l.id, label: formatLoc(l) }));
                  break;
                case 'proprietaire':
                  options = proprietaires.map((p) => ({ id: p.id, label: formatProp(p) }));
                  break;
                case 'intervention':
                  options = interventions.map((i) => ({ id: i.id, label: `Int #${i.id}` }));
                  break;
                case 'reclamation':
                  options = reclamations.map((r) => ({ id: r.id, label: `Rec #${r.id}` }));
                  break;
                default:
                  options = [];
              }

              return (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''} // 👈 important
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {options.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Qui paie (payer_type)</Label>
          <Controller
            name="payer_type"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(v) => { field.onChange(v); setValue('payer_id', ''); }}
                value={field.value || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locataire">Locataire</SelectItem>
                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                  <SelectItem value="societe">Société (nous)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {payerType !== 'societe' && (
          <div className="space-y-2">
            <Label>Payeur (payer_id)</Label>
            <Controller
              key={payerType}
              name="payer_id"
              control={control}
              render={({ field }) => {
                const options =
                  payerType === 'locataire'
                    ? locataires.map((l) => ({ id: l.id, label: formatLoc(l) }))
                    : proprietaires.map((p) => ({ id: p.id, label: formatProp(p) }));

                return (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {options.map(o => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Titre</Label>
        <Input {...register('titre')} placeholder="Titre court de la charge" />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...register('notes')} placeholder="Description ou détails..." />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={isCreating || isUpdating || !isAllowed}>
          {isCreating || isUpdating ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  );
}
