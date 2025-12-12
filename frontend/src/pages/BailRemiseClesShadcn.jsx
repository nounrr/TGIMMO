import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetBailQuery, useGetRemisesClesQuery, useCreateRemiseCleMutation, useUpdateRemiseCleMutation } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RemiseCleDocEditor from '@/components/RemiseCleDocEditor';
import { KeyRound, ArrowLeft, Plus, X, RefreshCw, Calendar, User, Building2, CheckCircle2, FileText, Pencil } from 'lucide-react';

const normalizeCles = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const out = [];
    const mapping = {
      porte_principale: 'Porte principale',
      boite_lettres: 'Boîte aux lettres',
      portail_garage: 'Portail / Garage'
    };
    Object.entries(mapping).forEach(([key, label]) => {
      const node = raw[key];
      if (!node) return;
      const qty = node.nombre ?? node.count;
      const checked = node.checked === undefined || node.checked === true;
      if (checked && qty && qty > 0) {
        out.push({ type: key, label, nombre: qty });
      }
    });
    if (Array.isArray(raw.autres)) {
      raw.autres.forEach(a => {
        if (!a) return;
        const qty = a.nombre ?? a.count;
        if (a.label && qty && qty > 0) {
          out.push({ type: 'autre', label: a.label, nombre: qty });
        }
      });
    }
    return out;
  }
  return [];
};

function RemiseCleEditForm({ remise, onSuccess }) {
  const [updateRemise, { isLoading }] = useUpdateRemiseCleMutation();
  
  const [dateRemise, setDateRemise] = useState('');
  const [portes, setPortes] = useState({ checked: false, nombre: 0 });
  const [boites, setBoites] = useState({ checked: false, nombre: 0 });
  const [portails, setPortails] = useState({ checked: false, nombre: 0 });
  const [autresList, setAutresList] = useState([]);
  const [remarques, setRemarques] = useState('');

  useEffect(() => {
    if (remise) {
      setDateRemise(remise.date_remise ? new Date(remise.date_remise).toISOString().slice(0,16) : '');
      setRemarques(remise.remarques || '');
      
      const cles = normalizeCles(remise.cles);
      
      const p = cles.find(c => c.type === 'porte_principale');
      setPortes({ checked: !!p, nombre: p ? p.nombre : 0 });
      
      const b = cles.find(c => c.type === 'boite_lettres');
      setBoites({ checked: !!b, nombre: b ? b.nombre : 0 });
      
      const g = cles.find(c => c.type === 'portail_garage');
      setPortails({ checked: !!g, nombre: g ? g.nombre : 0 });
      
      const autres = cles.filter(c => c.type === 'autre');
      setAutresList(autres.map(a => ({ label: a.label, nombre: a.nombre })));
      if (autres.length === 0) setAutresList([{ label: '', nombre: 0 }]);
    }
  }, [remise]);

  const addAutre = () => setAutresList(l => [...l, { label: '', nombre: 0 }]);
  const updateAutre = (idx, key, val) => setAutresList(l => l.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  const removeAutre = (idx) => setAutresList(l => l.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    const cles = [];
    if (portes.checked && portes.nombre > 0) cles.push({ type: 'porte_principale', label: 'Porte principale', nombre: Number(portes.nombre) });
    if (boites.checked && boites.nombre > 0) cles.push({ type: 'boite_lettres', label: 'Boîte aux lettres', nombre: Number(boites.nombre) });
    if (portails.checked && portails.nombre > 0) cles.push({ type: 'portail_garage', label: 'Portail / Garage', nombre: Number(portails.nombre) });
    const autres = autresList.map(a => ({ ...a, nombre: Number(a.nombre) }))
      .filter(a => a.label && a.nombre > 0)
      .map(a => ({ type: 'autre', label: a.label, nombre: a.nombre }));

    const payload = { date_remise: new Date(dateRemise).toISOString(), cles: [...cles, ...autres], remarques: remarques || undefined };
    if (payload.cles.length === 0) { alert('Veuillez sélectionner au moins une clé avec une quantité.'); return; }
    
    try {
      await updateRemise({ id: remise.id, payload }).unwrap();
      if (onSuccess) onSuccess();
    } catch (e) { console.error(e); alert("Erreur lors de la modification"); }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Date & heure</Label>
        <Input type="datetime-local" value={dateRemise} onChange={(e) => setDateRemise(e.target.value)} required />
      </div>

      <div className="space-y-3">
        <Label>Clés remises</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="edit_porte_principale" checked={portes.checked} onCheckedChange={(v) => setPortes(p => ({ ...p, checked: !!v }))} />
              <Label htmlFor="edit_porte_principale" className="font-normal">Porte principale</Label>
            </div>
            <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={portes.nombre} onChange={(e) => setPortes(p => ({ ...p, nombre: e.target.value }))} disabled={!portes.checked} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="edit_boite_lettres" checked={boites.checked} onCheckedChange={(v) => setBoites(p => ({ ...p, checked: !!v }))} />
              <Label htmlFor="edit_boite_lettres" className="font-normal">Boîte aux lettres</Label>
            </div>
            <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={boites.nombre} onChange={(e) => setBoites(p => ({ ...p, nombre: e.target.value }))} disabled={!boites.checked} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="edit_portail" checked={portails.checked} onCheckedChange={(v) => setPortails(p => ({ ...p, checked: !!v }))} />
              <Label htmlFor="edit_portail" className="font-normal">Portail / Garage</Label>
            </div>
            <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={portails.nombre} onChange={(e) => setPortails(p => ({ ...p, nombre: e.target.value }))} disabled={!portails.checked} />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="mb-0">Autres éléments</Label>
            <Button type="button" variant="outline" size="sm" onClick={addAutre} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
          </div>
          <div className="space-y-2">
            {autresList.map((a, idx) => (
              <div className="flex items-center gap-2" key={idx}>
                <Input placeholder="Ex: télécommande, badge" value={a.label} onChange={(e) => updateAutre(idx, 'label', e.target.value)} />
                <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={a.nombre} onChange={(e) => updateAutre(idx, 'nombre', e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAutre(idx)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Remarques (optionnel)</Label>
        <Textarea rows={3} placeholder="Observations, précisions sur les clés..." value={remarques} onChange={(e) => setRemarques(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
}

export default function BailRemiseClesShadcn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: bailData } = useGetBailQuery(id);
  const { can } = useAuthz();
  const bail = bailData?.data || bailData;

  const { data: remisesData, refetch } = useGetRemisesClesQuery(id);
  const remises = remisesData?.data || [];

  const [createRemise, { isLoading }] = useCreateRemiseCleMutation();

  const [dateRemise, setDateRemise] = useState(() => new Date().toISOString().slice(0,16));
  const [portes, setPortes] = useState({ checked: false, nombre: 0 });
  const [boites, setBoites] = useState({ checked: false, nombre: 0 });
  const [portails, setPortails] = useState({ checked: false, nombre: 0 });
  const [autresList, setAutresList] = useState([{ label: '', nombre: 0 }]);
  const [remarques, setRemarques] = useState('');
  const [selectedRemise, setSelectedRemise] = useState(null);

  const addAutre = () => setAutresList(l => [...l, { label: '', nombre: 0 }]);
  const updateAutre = (idx, key, val) => setAutresList(l => l.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  const removeAutre = (idx) => setAutresList(l => l.filter((_, i) => i !== idx));

  // normalizeCles moved outside component to be reusable


  const onSubmit = async (e) => {
    e.preventDefault();
    const cles = [];
    if (portes.checked && portes.nombre > 0) cles.push({ type: 'porte_principale', label: 'Porte principale', nombre: Number(portes.nombre) });
    if (boites.checked && boites.nombre > 0) cles.push({ type: 'boite_lettres', label: 'Boîte aux lettres', nombre: Number(boites.nombre) });
    if (portails.checked && portails.nombre > 0) cles.push({ type: 'portail_garage', label: 'Portail / Garage', nombre: Number(portails.nombre) });
    const autres = autresList.map(a => ({ ...a, nombre: Number(a.nombre) }))
      .filter(a => a.label && a.nombre > 0)
      .map(a => ({ type: 'autre', label: a.label, nombre: a.nombre }));

    const payload = { date_remise: new Date(dateRemise).toISOString(), cles: [...cles, ...autres], remarques: remarques || undefined };
    if (payload.cles.length === 0) { alert('Veuillez sélectionner au moins une clé avec une quantité.'); return; }
    try {
      await createRemise({ bailId: id, payload }).unwrap();
      setRemarques(''); setPortes({ checked: false, nombre: 0 }); setBoites({ checked: false, nombre: 0 }); setPortails({ checked: false, nombre: 0 }); setAutresList([{ label: '', nombre: 0 }]);
      refetch();
    } catch (e) { console.error(e); alert("Erreur lors de l'enregistrement de la remise de clés"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-8 w-8 text-amber-600" />
              Remise de clés
            </h1>
            {bail && (
              <p className="text-slate-500 text-sm">Bail #{bail.id} • {bail.numero_bail} • Locataire: {bail.locataire?.prenom} {bail.locataire?.nom}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {can(PERMS.remises_cles.create) && (
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle remise</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date & heure</Label>
                  <Input type="datetime-local" value={dateRemise} onChange={(e) => setDateRemise(e.target.value)} required />
                </div>

                <div className="space-y-3">
                  <Label>Clés remises</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="porte_principale" checked={portes.checked} onCheckedChange={(v) => setPortes(p => ({ ...p, checked: !!v }))} />
                        <Label htmlFor="porte_principale" className="font-normal">Porte principale</Label>
                      </div>
                      <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={portes.nombre} onChange={(e) => setPortes(p => ({ ...p, nombre: e.target.value }))} disabled={!portes.checked} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="boite_lettres" checked={boites.checked} onCheckedChange={(v) => setBoites(p => ({ ...p, checked: !!v }))} />
                        <Label htmlFor="boite_lettres" className="font-normal">Boîte aux lettres</Label>
                      </div>
                      <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={boites.nombre} onChange={(e) => setBoites(p => ({ ...p, nombre: e.target.value }))} disabled={!boites.checked} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="portail" checked={portails.checked} onCheckedChange={(v) => setPortails(p => ({ ...p, checked: !!v }))} />
                        <Label htmlFor="portail" className="font-normal">Portail / Garage</Label>
                      </div>
                      <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={portails.nombre} onChange={(e) => setPortails(p => ({ ...p, nombre: e.target.value }))} disabled={!portails.checked} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="mb-0">Autres éléments</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addAutre} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
                    </div>
                    <div className="space-y-2">
                      {autresList.map((a, idx) => (
                        <div className="flex items-center gap-2" key={idx}>
                          <Input placeholder="Ex: télécommande, badge" value={a.label} onChange={(e) => updateAutre(idx, 'label', e.target.value)} />
                          <Input type="number" onWheel={(e) => e.target.blur()} min="0" className="w-28" placeholder="Qté" value={a.nombre} onChange={(e) => updateAutre(idx, 'nombre', e.target.value)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeAutre(idx)}><X className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remarques (optionnel)</Label>
                  <Textarea rows={3} placeholder="Observations, précisions sur les clés..." value={remarques} onChange={(e) => setRemarques(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => { setRemarques(''); setPortes({ checked:false, nombre:0 }); setBoites({ checked:false, nombre:0 }); setPortails({ checked:false, nombre:0 }); setAutresList([{ label:'', nombre:0 }]); setDateRemise(new Date().toISOString().slice(0,16)); }}>
                    Effacer
                  </Button>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {can(PERMS.remises_cles.view) && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Historique <Badge variant="outline" className="ml-2">{remises.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {remises.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Aucune remise enregistrée</div>
              ) : (
                remises.map((r, index) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-4 w-4" />
                        <div className="font-medium">{new Date(r.date_remise).toLocaleString()}</div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Enregistrée</Badge>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Clés remises</div>
                      <div className="flex flex-wrap gap-2">
                        {normalizeCles(r.cles).map((c, idx) => (
                          <Badge key={idx} variant="outline" className="gap-1">
                            <KeyRound className="h-3 w-3" /> {c.label || c.type}
                            <span className="ml-1 rounded-full bg-primary text-white w-5 h-5 inline-flex items-center justify-center text-[10px]">{c.nombre}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {r.remarques && (
                      <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-sm text-amber-800">{r.remarques}</div>
                    )}
                    {r.user && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                        <User className="h-3 w-3" /> Ajouté par <span className="text-slate-700">{r.user.name || 'Utilisateur'}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="mt-2 w-full gap-2" onClick={() => setSelectedRemise(r)}>
                      <Pencil className="h-4 w-4" /> Détails / Modifier
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedRemise} onOpenChange={(open) => !open && setSelectedRemise(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la remise de clés</DialogTitle>
          </DialogHeader>
          {selectedRemise && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="doc">Document (PV)</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <RemiseCleEditForm remise={selectedRemise} onSuccess={() => { setSelectedRemise(null); refetch(); }} />
              </TabsContent>
              <TabsContent value="doc">
                <RemiseCleDocEditor remiseCle={selectedRemise} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
