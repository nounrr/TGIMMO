import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetMandatQuery, useUpdateMandatMutation } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, ArrowLeft, Download, RefreshCw, Save } from 'lucide-react';
import MandatDocEditor from "../components/MandatDocEditor";
import html2pdf from 'html2pdf.js';

// No date helpers needed anymore (legacy form removed)

export default function MandatEditShadcn() {
  const { id } = useParams();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuthz();
  const { toast } = useToast();
  const mandatState = location.state?.mandat;
  const uniteIdFromState = location.state?.uniteId;
  const { data, isFetching } = useGetMandatQuery(id, { skip: !!mandatState });
  const [form, setForm] = useState(null);
  const [updateMandat, { isLoading: isUpdating }] = useUpdateMandatMutation();
  const editorRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isNew) {
      // Redirect to mandates list if trying to create new mandate via this form
      // Creation should be done via Unite Owners tab
      navigate('/mandats');
      return;
    }

    const source = mandatState || data;
    if (source && !form) {
      setForm({
        reference: source.reference || '',
        statut: source.statut || 'brouillon',
      });
    }
  }, [data, mandatState, form, isNew]);

  // Auto-download when arriving with ?download=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldDownload = params.get('download') === '1';
    if (shouldDownload && editorRef.current) {
      // Slight delay to ensure editor content is ready
      setTimeout(() => {
        handleDownloadPdf();
      }, 300);
    }
  }, [location.search, editorRef.current]);

  if ((isFetching && !mandatState) || !form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGlobalSave = async () => {
    try {
      let docData = {};
      if (editorRef.current) {
        try {
            docData = await editorRef.current.getContent();
        } catch (e) {
            console.error("Error getting editor content", e);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de récupérer le contenu du document.' });
            return;
        }
      }
      
      const payload = {
        ...form, // reference, statut
        ...docData // doc_content, doc_variables, doc_template_key
      };

      await updateMandat({ id, payload }).unwrap();
      toast({ title: 'Succès', description: 'Mandat enregistré.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: err?.data?.message || 'Impossible de sauvegarder.' });
    }
  };

  const handleDownloadPdf = async () => {
    if (!editorRef.current) return;
    
    try {
      setIsDownloading(true);
      toast({ title: 'Génération du PDF', description: 'Veuillez patienter...' });
      
      const docData = await editorRef.current.getContent();
      let htmlContent = docData.doc_content;
      const docVariables = docData.doc_variables;

      // Client-side variable substitution
      Object.entries(docVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          htmlContent = htmlContent.replace(regex, value || '');
      });

      // Post-process mixed Arabic + numbers for visual order
      htmlContent = htmlContent.replace(/[\u0600-\u06FF]+\s*\d+/g, (segment) => {
        const m = segment.match(/([\u0600-\u06FF]+)\s*(\d+)/);
        if (!m) return segment;
        const [, ar, num] = m;
        return `<span class="rtl">${ar}<span class="ltr">\u200E${num}\u200E</span></span>`;
      });

      // Create a temporary container for PDF generation
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      element.style.fontFamily = "'Tajawal', sans-serif";
      element.style.padding = '20px';
      element.style.width = '100%';
      element.style.lineHeight = '1.6';
      element.style.wordSpacing = '0.6px';
      const style = document.createElement('style');
      style.textContent = `.rtl{direction:rtl;unicode-bidi:isolate;} .ltr{direction:ltr;unicode-bidi:isolate;}`;
      element.prepend(style);

      const opt = {
        margin:       [20, 12, 20, 12],
        filename:     `mandat_${form.reference || id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();

      toast({ title: 'Succès', description: 'PDF téléchargé.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le PDF.' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/mandats')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Modifier le mandat
            </h1>
            <p className="text-slate-500">Référence: {form.reference || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading} className="gap-2">
            {isDownloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Télécharger PDF
          </Button>
          <Button onClick={handleGlobalSave} disabled={isUpdating || (editorRef.current && !editorRef.current.getIsReady())} className="gap-2 bg-blue-600 hover:bg-blue-700">
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        {form.statut === 'modifier' && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Ce mandat est marqué comme <strong>À Modifier</strong>. Les propriétaires de l'unité ont probablement changé.
                  Veuillez vérifier les informations et mettre à jour le mandat ou créer un avenant.
                </p>
              </div>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Référence</Label>
              <Input
                value={form.reference}
                onChange={e => onChange('reference', e.target.value)}
                placeholder="Ex: MANDAT-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => onChange('statut', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="en_validation">En validation</SelectItem>
                  <SelectItem value="signe">Signé</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="modifier">À Modifier</SelectItem>
                  <SelectItem value="resilie">Résilié</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <MandatDocEditor ref={editorRef} mandat={{ ...data, ...form }} />
      </div>
    </div>
  );
}
