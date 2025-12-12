import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import FroalaEditorComponent from 'react-froala-wysiwyg';
import 'froala-editor/js/plugins.pkgd.min.js';
import 'froala-editor/js/languages/fr.js';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RefreshCw, Eye, Plus, X, FileText, Sparkles, Building2, Download, Save } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { 
  useGetRemiseCleEditorTemplateQuery,
  useRenderRemiseClePreviewMutation,
  useUpdateRemiseCleMutation,
} from "../api/baseApi";

const RemiseCleDocEditor = forwardRef(({ remiseCle }, ref) => {
  const id = remiseCle?.id;
  const { toast } = useToast();
  const { data: tplData, isFetching } = useGetRemiseCleEditorTemplateQuery(id, { skip: !id });
  const [renderPreview, { isLoading: isRendering }] = useRenderRemiseClePreviewMutation();
  const [updateRemise, { isLoading: isSaving }] = useUpdateRemiseCleMutation();

  const [model, setModel] = useState('');
  const editorInstanceRef = useRef(null);

  const initialHtml = useMemo(() => (remiseCle?.doc_content || tplData?.template || ''), [remiseCle, tplData]);
  const initialVars = useMemo(() => {
    const stored = remiseCle?.doc_variables || {};
    const fresh = tplData?.variables || {};
    return { ...stored, ...fresh };
  }, [remiseCle, tplData]);

  const [vars, setVars] = useState({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [templateKey, setTemplateKey] = useState(remiseCle?.doc_template_key || tplData?.template_key || 'remise_cle_default');
  const [isDownloading, setIsDownloading] = useState(false);

  const groupedVars = useMemo(() => {
    const groups = {};
    Object.entries(vars).forEach(([key, value]) => {
      const [prefix, ...rest] = key.split('.');
      const groupName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push({ key, value, label: rest.join('.') || key });
    });
    return groups;
  }, [vars]);

  useEffect(() => {
    setVars(initialVars || {});
  }, [initialVars]);

  useEffect(() => {
    setModel(initialHtml);
  }, [initialHtml]);

  useImperativeHandle(ref, () => ({
    getIsReady() {
      return true;
    },
    async getContent() {
      return {
        doc_content: model || '',
        doc_variables: vars,
        doc_template_key: templateKey
      };
    }
  }));

  const insertVariable = (key) => {
    if (editorInstanceRef.current) {
        const value = String(vars[key] ?? '');
        editorInstanceRef.current.html.insert(value);
    }
  };

  const loadTemplate = () => {
    if (tplData?.template) {
        setModel(tplData.template);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await renderPreview({ id, payload: { content: model, variables: vars } }).unwrap();
      setPreviewHtml(res?.html || '');
      setShowPreviewModal(true);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Aperçu impossible' });
    }
  };

  const handleSave = async () => {
    try {
      await updateRemise({ 
        id, 
        payload: { 
          doc_content: model, 
          doc_variables: vars, 
          doc_template_key: templateKey 
        } 
      }).unwrap();
      toast({ title: 'Succès', description: 'Document enregistré.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer.' });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      toast({ title: 'Génération du PDF', description: 'Veuillez patienter...' });
      
      let htmlContent = model || '';
      const docVariables = { ...vars };

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
      element.className = 'fr-view'; // Apply Froala styles
      const style = document.createElement('style');
      style.textContent = `.rtl{direction:rtl;unicode-bidi:isolate;} .ltr{direction:ltr;unicode-bidi:isolate;}`;
      element.prepend(style);

      const opt = {
        margin:       [20, 12, 20, 12],
        filename:     `remise_cle_${id}.pdf`,
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

  const config = {
    placeholderText: 'Commencez à écrire...',
    charCounterCount: false,
    language: 'fr',
    direction: 'auto', // Support RTL/LTR automatically
    heightMin: 500,
    toolbarButtons: [
        'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|',
        'fontFamily', 'fontSize', 'color', 'inlineStyle', 'paragraphStyle', '|',
        'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', '-',
        'insertLink', 'insertImage', 'insertVideo', 'insertFile', 'insertTable', '|',
        'emoticons', 'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting', '|',
        'print', 'help', 'html', '|', 'undo', 'redo', 'fullscreen'
    ],
    events: {
        'initialized': function () {
            editorInstanceRef.current = this;
        }
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-800">Éditeur de PV Remise de Clés</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  {isSaving ? <RefreshCw className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>}
                  Enregistrer
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={loadTemplate} className="gap-2">
                      <Building2 className="h-4 w-4"/>
                      Modèle Standard
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Charger le modèle standard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={handlePreview} disabled={isRendering} className="gap-2">
                      {isRendering ? <RefreshCw className="animate-spin h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      Aperçu
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Prévisualiser avec variables interpolées</TooltipContent>
                </Tooltip>
                {id && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDownloadPdf} 
                        disabled={isDownloading} 
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                      >
                        {isDownloading ? <RefreshCw className="animate-spin h-4 w-4"/> : <Download className="h-4 w-4"/>}
                        Télécharger PDF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Télécharger le PDF</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {isFetching ? (
               <div className="flex items-center justify-center h-[600px] bg-slate-50">
                 <div className="text-center space-y-3">
                   <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                   <p className="text-slate-600 font-medium">Chargement du modèle...</p>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col">
                 <div className="bg-slate-50 px-4 py-2 border-b">
                   <div className="flex items-center gap-2 mb-2">
                     <Sparkles className="h-3 w-3 text-amber-500" />
                     <Label className="text-xs font-semibold text-slate-700">Variables</Label>
                     <span className="text-xs text-slate-500">- Cliquez pour insérer</span>
                   </div>
                   {Object.keys(vars).length === 0 ? (
                     <div className="text-xs text-slate-400 py-1">Aucune variable disponible</div>
                   ) : (
                     <Accordion type="single" collapsible="true" className="w-full">
                       {Object.entries(groupedVars).map(([groupName, items]) => (
                         <AccordionItem value={groupName} key={groupName} className="border-b-0">
                           <AccordionTrigger className="py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:no-underline">
                             {groupName} ({items.length})
                           </AccordionTrigger>
                           <AccordionContent>
                             <div className="flex flex-wrap gap-2 pb-2">
                               {items.map(({ key, value, label }) => (
                                 <Tooltip key={key}>
                                   <TooltipTrigger asChild>
                                     <button 
                                       type="button" 
                                       onClick={() => insertVariable(key)} 
                                       className="inline-flex items-center gap-1 text-xs font-mono bg-white text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors border border-blue-200 shadow-sm"
                                       title={value || '(vide)'}
                                     >
                                       {`{{${label}}}`}
                                       <Plus className="h-2.5 w-2.5"/>
                                     </button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <div className="text-xs">
                                       <div className="font-semibold">{key}</div>
                                       <div className="text-slate-400">{value || '(valeur vide)'}</div>
                                     </div>
                                   </TooltipContent>
                                 </Tooltip>
                               ))}
                             </div>
                           </AccordionContent>
                         </AccordionItem>
                       ))}
                     </Accordion>
                   )}
                 </div>
             
                 <div className="min-h-[560px] bg-white p-4">
                    <FroalaEditorComponent
                        tag='textarea'
                        config={config}
                        model={model}
                        onModelChange={setModel}
                    />
                 </div>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="w-auto max-w-none min-w-[50vw] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Aperçu du document
                </DialogTitle>
                <Button size="icon" variant="ghost" onClick={() => setShowPreviewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="bg-white border rounded p-6 shadow-inner fr-view" style={{ width: 'fit-content' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
});

RemiseCleDocEditor.displayName = 'RemiseCleDocEditor';

export default RemiseCleDocEditor;