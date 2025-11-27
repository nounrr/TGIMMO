import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  PlusCircle, 
  Edit, 
  Users, 
  UserPlus, 
  Link, 
  Key, 
  FileText, 
  Shield, 
  UserCog,
  Search,
  CheckCircle2
} from 'lucide-react';

const GuideImage = ({ icon: Icon, label, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
  }
  
  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-slate-50/50 p-8 flex flex-col items-center justify-center gap-4 transition-all hover:bg-slate-50 hover:shadow-sm">
      <div className={cn("h-20 w-20 rounded-2xl flex items-center justify-center shadow-sm ring-4 ring-white", colorClasses[color] || colorClasses.blue)}>
        <Icon size={40} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{label}</p>
        <p className="text-xs text-slate-400 mt-1">Illustration de l'interface</p>
      </div>
    </div>
  )
}

export default function GuideShadcn() {
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Guide d'application</h1>
        <p className="text-lg text-muted-foreground">
          Documentation interactive et guides visuels pour la gestion immobilière.
        </p>
      </div>

      <Tabs defaultValue="unites" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="unites" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Unités</TabsTrigger>
          <TabsTrigger value="proprietaires" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Propriétaires</TabsTrigger>
          <TabsTrigger value="locataires" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Locataires</TabsTrigger>
          <TabsTrigger value="employes" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Employés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="unites" className="mt-6 animate-in fade-in-50 duration-500">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl pb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Gestion des Unités</CardTitle>
              </div>
              <CardDescription className="text-blue-700/80 text-base">
                Guide complet pour créer, modifier et gérer votre parc immobilier.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Accordion type="single" collapsible defaultValue="create-unite" className="w-full">
                <AccordionItem value="create-unite" className="border-b-0 mb-4 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <PlusCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-lg font-semibold text-slate-800">Création d'une unité</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Pour ajouter une nouvelle unité à votre parc :</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Naviguez vers la page <strong>Unités</strong> via le menu latéral.</li>
                          <li>Cliquez sur le bouton <strong>Ajouter</strong> en haut à droite.</li>
                          <li>Remplissez le formulaire avec les informations essentielles :
                            <ul className="list-disc list-inside ml-6 mt-1 text-sm text-slate-500">
                              <li>Adresse complète</li>
                              <li>Surface (m²)</li>
                              <li>Type de bien (Appartement, Villa, etc.)</li>
                            </ul>
                          </li>
                          <li>Validez pour enregistrer.</li>
                        </ol>
                      </div>
                      <GuideImage icon={Building2} label="Formulaire de création d'unité" color="blue" />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="edit-unite" className="border-b-0 mb-4 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <Edit className="h-5 w-5 text-indigo-500" />
                      <span className="text-lg font-semibold text-slate-800">Modification et détails</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Pour mettre à jour les informations d'une unité :</p>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>Repérez l'unité dans la liste principale.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>Cliquez sur l'icône <strong>Crayon</strong> pour éditer.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>Modifiez les champs nécessaires et sauvegardez.</span>
                          </li>
                        </ul>
                      </div>
                      <GuideImage icon={Edit} label="Interface de modification" color="indigo" />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="search-unite" className="border-b-0 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-slate-500" />
                      <span className="text-lg font-semibold text-slate-800">Recherche et filtres</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Utilisez la barre de recherche en haut de la liste pour filtrer par :</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Nom de l'unité</li>
                          <li>Adresse</li>
                          <li>Ville</li>
                        </ul>
                        <p className="mt-4">Les filtres avancés vous permettent de trier par statut (Occupé, Vacant, En travaux).</p>
                      </div>
                      <GuideImage icon={Search} label="Barre de recherche et filtres" color="purple" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proprietaires" className="mt-6 animate-in fade-in-50 duration-500">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl pb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <UserCog className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-emerald-900">Gestion des Propriétaires</CardTitle>
              </div>
              <CardDescription className="text-emerald-700/80 text-base">
                Administration des comptes propriétaires et de leurs mandats.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Accordion type="single" collapsible defaultValue="add-owner" className="w-full">
                <AccordionItem value="add-owner" className="border-b-0 mb-4 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-emerald-500" />
                      <span className="text-lg font-semibold text-slate-800">Ajout d'un propriétaire</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Pour enregistrer un nouveau propriétaire :</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Allez dans la section <strong>Propriétaires</strong>.</li>
                          <li>Cliquez sur <strong>Nouveau Propriétaire</strong>.</li>
                          <li>Saisissez les informations personnelles (Nom, Email, Téléphone).</li>
                          <li>Ajoutez les informations bancaires (RIB) pour les versements.</li>
                        </ol>
                      </div>
                      <GuideImage icon={UserPlus} label="Fiche nouveau propriétaire" color="green" />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="link-units" className="border-b-0 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <Link className="h-5 w-5 text-teal-500" />
                      <span className="text-lg font-semibold text-slate-800">Association aux unités</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Lier un propriétaire à ses biens :</p>
                        <p>Cela peut se faire de deux manières :</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                          <li>Depuis la fiche <strong>Unité</strong> : Sélectionnez "Gérer les propriétaires" et ajoutez-le.</li>
                          <li>Depuis la fiche <strong>Propriétaire</strong> : Utilisez l'onglet "Biens" pour lui affecter des unités existantes.</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">Note : Une unité peut avoir plusieurs propriétaires (indivision).</p>
                      </div>
                      <GuideImage icon={Link} label="Interface d'association" color="green" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locataires" className="mt-6 animate-in fade-in-50 duration-500">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-xl pb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-2xl text-amber-900">Gestion des Locataires</CardTitle>
              </div>
              <CardDescription className="text-amber-700/80 text-base">
                Suivi des locataires, baux et paiements.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Accordion type="single" collapsible defaultValue="register-tenant" className="w-full">
                <AccordionItem value="register-tenant" className="border-b-0 mb-4 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-amber-500" />
                      <span className="text-lg font-semibold text-slate-800">Enregistrement locataire</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Créez une fiche locataire complète :</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                          <li>Informations d'identité (CNI, Passeport)</li>
                          <li>Coordonnées de contact</li>
                          <li>Situation professionnelle et revenus</li>
                          <li>Garants éventuels</li>
                        </ul>
                      </div>
                      <GuideImage icon={Users} label="Dossier locataire" color="amber" />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="create-lease" className="border-b-0 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <span className="text-lg font-semibold text-slate-800">Création de bail</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Pour contractualiser une location :</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Allez dans <strong>Baux</strong> {'>'} <strong>Nouveau Bail</strong>.</li>
                          <li>Sélectionnez l'unité et le locataire.</li>
                          <li>Définissez les dates (début, fin) et le montant du loyer.</li>
                          <li>Configurez les charges et la périodicité.</li>
                          <li>Générez le document PDF automatiquement.</li>
                        </ol>
                      </div>
                      <GuideImage icon={FileText} label="Assistant création de bail" color="amber" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employes" className="mt-6 animate-in fade-in-50 duration-500">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl pb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl text-purple-900">Gestion des Employés</CardTitle>
              </div>
              <CardDescription className="text-purple-700/80 text-base">
                Administration des accès, rôles et permissions du personnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Accordion type="single" collapsible defaultValue="roles" className="w-full">
                <AccordionItem value="roles" className="border-b-0 mb-4 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-purple-500" />
                      <span className="text-lg font-semibold text-slate-800">Rôles et Permissions</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Configurez finement les accès :</p>
                        <p>Dans la section <strong>Rôles & Permissions</strong>, vous pouvez :</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                          <li>Créer des rôles personnalisés (ex: Gestionnaire, Comptable).</li>
                          <li>Attribuer des permissions spécifiques à chaque rôle (Lecture, Écriture, Suppression).</li>
                          <li>Voir la matrice des accès en temps réel.</li>
                        </ul>
                      </div>
                      <GuideImage icon={Shield} label="Matrice des permissions" color="purple" />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="staff-list" className="border-b-0 rounded-lg border px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-pink-500" />
                      <span className="text-lg font-semibold text-slate-800">Suivi du personnel</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>Gérez votre équipe au quotidien :</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                          <li>Ajoutez de nouveaux collaborateurs.</li>
                          <li>Assignez-leur un ou plusieurs rôles.</li>
                          <li>Activez ou désactivez les comptes en un clic.</li>
                          <li>Suivez les dernières connexions.</li>
                        </ul>
                      </div>
                      <GuideImage icon={Users} label="Liste des employés" color="purple" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
