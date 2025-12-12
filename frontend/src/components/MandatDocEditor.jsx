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
import { RefreshCw, Eye, Plus, X, FileText, Sparkles, Building2, User } from 'lucide-react';
import { 
  useGetMandatEditorTemplateQuery,
  useRenderMandatPreviewMutation,
} from "../api/baseApi";

const TEMPLATE_SOCIETE = `
<div dir="rtl" style="text-align: right;">
<p><strong>عقد تفويض لإدارة أملاك</strong></p>
<p>بين الموقعين أسفله:</p>
<p>شركة {{proprietaire.nom_complet}} شركة محدودة المسؤولية، في شخص ممثلها القانوني، مقرها ب {{proprietaire.adresse}}، ذات رأسمال {{proprietaire.chiffre_affaires}} درهم، مقيدة بالسجل التجاري لدى المحكمة التجارية {{proprietaire.ville_rc}} تحت الرقم التحليلي عدد {{proprietaire.rc}} يمثلها السيد {{proprietaire.representant_legal}}.</p>
<p style="text-align: center;">من جهة كطرف أول</p>
<p>شركة TANGER GESTION IMMO شركة محدودة المسؤولية للشريك الوحيد، في شخص ممثلها القانوني، مقرها الاجتماعي 8 شارع فاس الطابق 1 مكتب 6 طنجة، ذات رأسمال {{agence.capital}} درهم، مقيدة بالسجل التجاري لدى المحكمة التجارية بطنجة تحت الرقم التحليلي عدد 65139 يمثلها في هذا العقد السيد عثمان اليعقوبي K367545.</p>
<p style="text-align: center;">من جهة أخرى كطرف ثاني</p>
<p>وقع الاتفاق و التراضي على مايلي:</p>
<p><strong>الفصل الأول:</strong></p>
<p>أن الطرف الأول بما لديه من صلاحيات يمنح للطرف الثاني، بما لهذا الأخير من خبرة في مجال تسيير أملاك الغير، التفويض التام في كافة الأعمال المتعلقة بإدارة و تسيير جميع العمارة الكائنة بشارع {{unite.adresse}}، موضوع الرسوم العقارية التالية:</p>
<p>{{unite.titre_foncier}}</p>
<p>و المملوكة جميعها لشركة {{proprietaire.nom_complet}}.</p>
<p><strong>الفصل الثاني:</strong></p>
<p>أن يتعاقد الطرف الثاني TANGER GESTION IMMO نيابة عن الطرف الأول مع المكتري وله الحق بإبرام العقود والتوقيع عليها وتجديدها إن انتهت مدتها وتعديلها وكل ذلك وفقا للشروط والمشاهرة التي يراها مناسبة.</p>
<p><strong>الفصل الثالث:</strong></p>
<p>للطرف الثاني أن يصدر وصولات الكراء نيابة عن الطرف الأول ويوقعها ويسلمها للمكترين وله في سبيل ذلك تحصيل إيراداتها وإعطاء المخالصات والإبراء عليها.</p>
<p><strong>الفصل الرابع:</strong></p>
<p>إن الطرف الثاني TANGER GESTION IMMO بصفته نائبا مسيرا أن يوجه الإنذارات والإخطارات الرسمية إلى المكترين في حالة عدم أداء واجب الكراء.</p>
<p><strong>الفصل الخامس:</strong></p>
<p>يحق للطرف الثاني أن يطالب بإقالة وفسخ كل عقد إن اقتضى الحال ذلك كما يطالب بإخلاء المستأجرين إذا خالفوا إحدى البنود المنصوص عليها في العقد الكراء.</p>
<p><strong>الفصل السادس:</strong></p>
<p>في حال خالف أو اعترض أحد المستأجرين بندا من البنود أو القرارات أو القوانين المنظمة يحق للطرف الثاني اختيار وتعيين محام لاتخاذ الإجراءات اللازمة ورفع الدعاوى أو طلب الدفاع عنها أمام جميع المحاكم على اختلاف أنواعها ودرجاتها وذلك للدفاع على مصالح الشركة المالكة كلما اقتضى الأمر لذلك.</p>
<p><strong>الفصل السابع:</strong></p>
<p>يلتزم الطرف الثاني بأن يوافي الطرف الأول على كل ثلاثة أشهر ( حساب ربع سنوي) ببيان حساب يتضمن الإيرادات والمصاريف مع المستندات ذات الصلة وشيكا مرفقا يحمل المبلغ الصافي لفائدة الشركة المالكة.</p>
<p><strong>الفصل الثامن:</strong></p>
<p>تمنح للطرف الثاني TANGER GESTION IMMO أتعاب مقابل المهام المحددة في هذا العقد والمحددة في {{mandat.taux_gestion_pct}}% تحتسب من المجموع الخام لمداخيل الأكرية المحصلة، دون احتساب الرسوم.</p>
<p><strong>الفصل التاسع:</strong></p>
<p>يتحمل الطرف الثاني المسير الإشراف وانتداب مع أداء تكاليف الصيانة والإصلاحات الضرورية والمتعلقة بمرافق وخدمات العقار موضوع هذا العقد.</p>
<p><strong>الفصل العاشر:</strong></p>
<p>بمجرد التوقيع على هذا العقد تصرح الشركة المالكة في شخص ممثلها القانوني بقبول الشركة المسيرة وكيلا عنها في إدارة وتسيير شؤون العمارة المذكورة أعلاه وتمثلها كذلك أمام الجهات الرسمية أو غير الرسمية والإدارات العمومية والشبه العمومية لتنفيذ أعمال الإدارة عل النحو الذي يحفظ حقوق ومصالح الشركة المالكة.</p>
<p>حرر بطنجة، بتاريخ:</p>
<p><strong>التوقيعات:</strong></p>
<table style="width: 100%;">
<tr>
<td style="text-align: center;"
TANGER GESTION IMMO<br>
شركة محدودة المسؤولية<br>
في شخص ممثلها القانوني<br>
السيد عثمان اليعقوبي
</td>
<td style="text-align: center;">
{{proprietaire.nom_complet}}<br>
شركة محدودة المسؤولية<br>
في شخص ممثلها القانوني<br>
السيد {{proprietaire.representant_legal}}
</td>
</tr>
</table>
</div>
`;

const TEMPLATE_PERSONNE = `
<div dir="rtl" style="text-align: right;">
<p><strong>عقد تفويض لإدارة أملاك</strong></p>
<p>بين الموقعين أسفله:</p>
<p>السيد {{proprietaire.nom_complet}}، مغربي، صاحب البطاقة الوطنية رقم {{proprietaire.cin}} الساكن ب {{proprietaire.adresse}}.</p>
<p style="text-align: center;">من جهة كطرف أول</p>
<p>شركة TANGER GESTION IMMO شركة محدودة المسؤولية للشريك الوحيد، في شخص ممثلها القانوني، مقرها الاجتماعي 8 شارع فاس الطابق 1 مكتب 6 طنجة، ذات رأسمال {{agence.capital}} درهم، مقيدة بالسجل التجاري لدى المحكمة التجارية بطنجة تحت الرقم التحليلي عدد 65139 يمثلها في هذا العقد السيد عثمان اليعقوبي K367545.</p>
<p style="text-align: center;">من جهة أخرى كطرف ثاني</p>
<p>وقع الاتفاق و التراضي على مايلي:</p>
<p><strong>الفصل الأول:</strong></p>
<p>أن الطرف الأول بما لديه من صلاحيات يمنح للطرف الثاني، بما لهذا الأخير من خبرة في مجال تسيير أملاك الغير، التفويض التام في كافة الأعمال المتعلقة بإدارة وتسيير جميع العمارة الكائنة بشارع {{unite.adresse}}، موضوع الرسوم العقارية المستخرجة من الرسم العقاري الأم عدد {{unite.titre_foncier}} والمملوكة جميعها للسيد {{proprietaire.nom_complet}}.</p>
<p><strong>الفصل الثاني:</strong></p>
<p>أن يتعاقد الطرف الثاني TANGER GESTION IMMO نيابة عن الطرف الأول مع المكتري وله الحق بإبرام العقود والتوقيع عليها وتجديدها إن انتهت مدتها وتعديلها وكل ذلك وفقا للشروط والمشاهرة التي يراها مناسبة.</p>
<p><strong>الفصل الثالث:</strong></p>
<p>للطرف الثاني أن يصدر وصولات الكراء نيابة عن الطرف الأول ويوقعها ويسلمها للمكترين وله في سبيل ذلك تحصيل إيراداتها وإعطاء المخالصات والإبراء عليها.</p>
<p><strong>الفصل الرابع:</strong></p>
<p>إن الطرف الثاني TANGER GESTION IMMO بصفته نائبا مسيرا أن يوجه الإنذارات والإخطارات الرسمية إلى المكترين في حالة عدم أداء واجب الكراء.</p>
<p><strong>الفصل الخامس:</strong></p>
<p>يحق للطرف الثاني أن يطالب بإقالة وفسخ كل عقد إن اقتضى الحال ذلك كما يطالب بإخلاء المستأجرين إذا خالفوا إحدى البنود المنصوص عليها في العقد الكراء.</p>
<p><strong>الفصل السادس:</strong></p>
<p>في حال خالف أو اعترض أحد المستأجرين بندا من البنود أو القرارات أو القوانين المنظمة يحق للطرف الثاني اختيار وتعيين محام لاتخاذ الإجراءات اللازمة ورفع الدعاوى أو طلب الدفاع عنها أمام جميع المحاكم على اختلاف أنواعها ودرجاتها وذلك للدفاع على مصالح الشركة المالكة كلما اقتضى الأمر لذلك.</p>
<p><strong>الفصل السابع:</strong></p>
<p>يلتزم الطرف الثاني بأن يوافي الطرف الأول على كل ثلاثة أشهر ( حساب ربع سنوي) ببيان حساب يتضمن الإيرادات والمصاريف مع المستندات ذات الصلة وشيكا مرفقا يحمل المبلغ الصافي لفائدة الشركة المالكة.</p>
<p><strong>الفصل الثامن:</strong></p>
<p>تمنح للطرف الثاني TANGER GESTION IMMO أتعاب مقابل المهام المحددة في هذا العقد والمحددة في {{mandat.taux_gestion_pct}}% تحتسب من المجموع الخام لمداخيل الأكرية المحصلة، دون احتساب الرسوم.</p>
<p><strong>الفصل التاسع:</strong></p>
<p>يتحمل الطرف الثاني المسير الإشراف وانتداب مع أداء تكاليف الصيانة والإصلاحات الضرورية والمتعلقة بمرافق وخدمات العقار موضوع هذا العقد.</p>
<p><strong>الفصل العاشر:</strong></p>
<p>بمجرد التوقيع على هذا العقد تصرح الشركة المالكة في شخص ممثلها القانوني بقبول الشركة المسيرة وكيلا عنها في إدارة وتسيير شؤون العمارة المذكورة أعلاه وتمثلها كذلك أمام الجهات الرسمية أو غير الرسمية والإدارات العمومية والشبه العمومية لتنفيذ أعمال الإدارة عل النحو الذي يحفظ حقوق ومصالح الشركة المالكة.</p>
<p>حرر بطنجة، بتاريخ: 05/05/2023</p>
<p><strong>التوقيعات:</strong></p>
<table style="width: 100%;">
<tr>
<td style="text-align: center;">
TANGER GESTION IMMO<br>
شركة محدودة المسؤولية<br>
في شخص ممثلها القانوني<br>
السيد عثمان اليعقوبي
</td>
<td style="text-align: center;">
السيد {{proprietaire.nom_complet}}
</td>
</tr>
</table>
</div>
`;

const MandatDocEditor = forwardRef(({ mandat }, ref) => {
  const id = mandat?.id;
  const { toast } = useToast();
  const { data: tplData, isFetching } = useGetMandatEditorTemplateQuery(id);
  const [renderPreview, { isLoading: isRendering }] = useRenderMandatPreviewMutation();

  const [model, setModel] = useState('');
  const editorInstanceRef = useRef(null);

  const initialHtml = useMemo(() => (mandat?.doc_content || tplData?.template || ''), [mandat, tplData]);
  const initialVars = useMemo(() => {
    const stored = mandat?.doc_variables || {};
    const fresh = tplData?.variables || {};
    // Merge stored and fresh, prioritizing fresh data from DB to ensure updates (like CIN) are reflected
    return { ...stored, ...fresh };
  }, [mandat, tplData]);

  const [vars, setVars] = useState({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [templateKey, setTemplateKey] = useState(mandat?.doc_template_key || tplData?.template_key || 'mandat_default');

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

  const loadTemplate = (type) => {
    if (type === 'societe') {
      setModel(TEMPLATE_SOCIETE);
    } else if (type === 'personne') {
      setModel(TEMPLATE_PERSONNE);
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
                <CardTitle className="text-lg font-semibold text-slate-800">Éditeur de Document (Froala)</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => loadTemplate('societe')} className="gap-2">
                      <Building2 className="h-4 w-4"/>
                      Modèle Société
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Charger le modèle pour une société</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => loadTemplate('personne')} className="gap-2">
                      <User className="h-4 w-4"/>
                      Modèle Personne
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Charger le modèle pour une personne physique</TooltipContent>
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
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
            <div className="bg-white border rounded p-6 shadow-inner fr-view" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
});

MandatDocEditor.displayName = 'MandatDocEditor';

export default MandatDocEditor;
