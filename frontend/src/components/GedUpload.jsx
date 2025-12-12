import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUploadDocumentsMutation } from '../features/ged/gedApi';
import { useGetUnitesQuery } from '../features/unites/unitesApi';
import { useGetBauxQuery, useLazyGetBailQuery, useGetMandatsQuery, useGetAvenantsQuery, useGetInterventionsQuery, useGetDevisQuery, useGetFacturesQuery, useGetReclamationsQuery, useGetImputationChargesQuery } from '../api/baseApi';
import { useGetProprietairesQuery } from '../features/proprietaires/proprietairesApi';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import { useGetApprocheProprietairesQuery, useGetApprocheLocatairesQuery } from '../api/baseApi';
import ReactSelect from 'react-select';
import { X, Plus, Upload, File } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";

export default function GedUpload({ onSuccess, initialLinks = [] }) {
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState(initialLinks.length > 0 ? initialLinks : [{ type: 'unite', id: null }]);
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [uploadDocuments, { isLoading }] = useUploadDocumentsMutation();
  const [triggerGetBail] = useLazyGetBailQuery();
  const { toast } = useToast();

  // Fetch data for selects
  const { data: unitesData } = useGetUnitesQuery({ per_page: 1000 });
  const { data: bauxData } = useGetBauxQuery({ per_page: 1000 });
  const { data: proprietairesData } = useGetProprietairesQuery({ per_page: 1000 });
  const { data: locatairesData } = useGetLocatairesQuery({ per_page: 1000 });
  const { data: mandatsData } = useGetMandatsQuery({ per_page: 1000 });
  const { data: avenantsData } = useGetAvenantsQuery({ per_page: 1000 });
  const { data: interventionsData } = useGetInterventionsQuery({ per_page: 1000 });
  const { data: devisData } = useGetDevisQuery({ per_page: 1000 });
  const { data: facturesData } = useGetFacturesQuery({ per_page: 1000 });
  const { data: reclamationsData } = useGetReclamationsQuery({ per_page: 1000 });
  const { data: imputationsData } = useGetImputationChargesQuery({ per_page: 1000 });
  const { data: approchesPropData } = useGetApprocheProprietairesQuery({ per_page: 1000 });
  const { data: approchesLocData } = useGetApprocheLocatairesQuery({ per_page: 1000 });

  const asArray = (res) => res?.data || [];
  const baux = asArray(bauxData);
  const unites = asArray(unitesData);
  const locataires = asArray(locatairesData);
  const mandats = asArray(mandatsData);
  const avenants = asArray(avenantsData);
  const interventions = asArray(interventionsData);
  const devisList = asArray(devisData);
  const facturesList = asArray(facturesData);
  const reclamations = asArray(reclamationsData);
  const imputations = asArray(imputationsData);

  const options = {
    unite: unitesData?.data?.map(u => ({ value: u.id, label: `Unité ${u.numero_unite} - ${u.immeuble}` })) || [],
    bail: bauxData?.data?.map(b => ({ value: b.id, label: `Bail ${b.numero_bail}` })) || [],
    proprietaire: proprietairesData?.data?.map(p => ({ value: p.id, label: p.nom_raison || `${p.prenom} ${p.nom}` })) || [],
    locataire: locatairesData?.data?.map(l => ({ value: l.id, label: l.raison_sociale || `${l.prenom} ${l.nom}` })) || [],
    mandat: mandatsData?.data?.map(m => ({ value: m.id, label: `Mandat ${m.reference || m.id}` })) || [],
    avenant: avenantsData?.data?.map(a => ({ value: a.id, label: `Avenant ${a.reference || a.id}` })) || [],
    intervention: interventionsData?.data?.map(i => ({ value: i.id, label: `Intervention ${i.id}` })) || [],
    devis: devisData?.data?.map(d => ({ value: d.id, label: `Devis ${d.numero || d.id}` })) || [],
    facture: facturesData?.data?.map(f => ({ value: f.id, label: `Facture ${f.numero || f.id}` })) || [],
    reclamation: reclamationsData?.data?.map(r => ({ value: r.id, label: `Réclamation ${r.id}` })) || [],
    imputation_charge: imputationsData?.data?.map(ic => ({ value: ic.id, label: `Imputation ${ic.id}${ic.titre ? ` - ${ic.titre}` : ''}` })) || [],
    approche_proprietaire: approchesPropData?.data?.map(ap => ({ value: ap.id, label: `Approche Propriétaire ${ap.id}` })) || [],
    approche_locataire: approchesLocData?.data?.map(al => ({ value: al.id, label: `Approche Locataire ${al.id}` })) || [],
  };

  const handleFileChange = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addLink = () => {
    setLinks([...links, { type: 'unite', id: null }]);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = async (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    // Reset ID if type changes
    if (field === 'type') {
      newLinks[index].id = null;
      setSuggestions([]);
    }
    setLinks(newLinks);
    // No derived suggestions: only link exactly what the user selects
    if (field === 'id') setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins un fichier.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files[]', file));
    formData.append('description', description);
    
    const validLinks = links.filter(l => l.id);
    const acceptedSuggestions = suggestions.filter(s => s.selected).map(({ type, id }) => ({ type, id }));
    const finalLinks = [...validLinks, ...acceptedSuggestions];
    finalLinks.forEach((link, index) => {
      formData.append(`links[${index}][type]`, link.type);
      formData.append(`links[${index}][id]`, link.id);
    });

    try {
      await uploadDocuments(formData).unwrap();
      toast({ title: "Succès", description: "Documents téléchargés avec succès." });
      setFiles([]);
      setDescription('');
      setSuggestions([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Échec du téléchargement.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Uploader des documents</h3>
      
      <div className="space-y-2">
        <Label>Fichiers</Label>
        <div className="flex items-center gap-2">
          <Input type="file" multiple onChange={handleFileChange} className="cursor-pointer" />
        </div>
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded text-sm">
                <span className="flex items-center gap-2"><File className="h-4 w-4" /> {file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description optionnelle..." />
      </div>

      <div className="space-y-2">
        <Label>Lier à</Label>
        {links.map((link, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="w-1/3">
              <Select value={link.type} onValueChange={(val) => updateLink(index, 'type', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unite">Unité</SelectItem>
                  <SelectItem value="bail">Bail</SelectItem>
                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                  <SelectItem value="locataire">Locataire</SelectItem>
                  <SelectItem value="mandat">Mandat</SelectItem>
                  <SelectItem value="avenant">Avenant</SelectItem>
                  <SelectItem value="intervention">Intervention</SelectItem>
                  <SelectItem value="devis">Devis</SelectItem>
                  <SelectItem value="facture">Facture</SelectItem>
                  <SelectItem value="reclamation">Réclamation</SelectItem>
                  <SelectItem value="imputation_charge">Imputation charge</SelectItem>
                  <SelectItem value="approche_proprietaire">Approche Propriétaire</SelectItem>
                  <SelectItem value="approche_locataire">Approche Locataire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-2/3">
              <ReactSelect
                options={options[link.type]}
                value={options[link.type]?.find(opt => String(opt.value) === String(link.id)) || null}
                onChange={(opt) => updateLink(index, 'id', opt ? opt.value : null)}
                placeholder="Rechercher..."
                isClearable
                // Keep menu within dialog to allow mouse clicks
                menuShouldScrollIntoView={false}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeLink(index)} disabled={links.length === 1}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLink} className="mt-1">
          <Plus className="h-4 w-4 mr-2" /> Ajouter une liaison
        </Button>
        {suggestions.length > 0 && (
          <div className="mt-3 rounded-md border p-3">
            <div className="mb-2 text-sm font-medium">Suggestions de liaisons</div>
            <div className="space-y-2">
              {suggestions.map((sug, idx) => (
                <div key={`${sug.type}-${sug.id}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`sug-${idx}`} checked={!!sug.selected} onCheckedChange={(checked) => {
                      setSuggestions(prev => prev.map((s, i) => i === idx ? { ...s, selected: !!checked } : s));
                    }} />
                    <Label htmlFor={`sug-${idx}`} className="text-sm">
                      {sug.label} <span className="text-slate-500">({sug.type})</span>
                    </Label>
                  </div>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setSuggestions(prev => prev.filter((_, i) => i !== idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {links.filter(l => l.id).length > 0 && (
          <div className="mt-3 rounded-md border p-3">
            <div className="mb-2 text-sm font-medium">Liaisons sélectionnées</div>
            <div className="flex flex-wrap gap-2">
              {links.filter(l => l.id).map((l, i) => {
                const opt = options[l.type]?.find(o => String(o.value) === String(l.id));
                const label = opt?.label || `${l.type} ${l.id}`;
                return (
                  <Badge key={`${l.type}-${l.id}-${i}`} variant="outline">{label}</Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
        {isLoading ? 'Téléchargement...' : <><Upload className="h-4 w-4 mr-2" /> Télécharger</>}
      </Button>
    </div>
  );
}
