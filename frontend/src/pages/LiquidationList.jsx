import React, { useState, useMemo } from 'react';
import { useGetLiquidationsQuery, useGetPendingLiquidationsQuery, useCreateLiquidationMutation } from '../api/baseApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, FileText, Calculator, Check, ArrowRight, ArrowUpDown } from 'lucide-react';
import useAuthz from '@/hooks/useAuthz';
import { useToast } from '@/hooks/use-toast';

export default function LiquidationList() {
  const { can } = useAuthz();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  
  // Filters for History
  const [historyFilters, setHistoryFilters] = useState({
    mois: '',
    annee: new Date().getFullYear().toString(),
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Filters for Pending
  const [pendingFilters, setPendingFilters] = useState({
    mois: (new Date().getMonth() + 1).toString(),
    annee: new Date().getFullYear().toString(),
  });

  // Detail View State
  const [selectedPending, setSelectedPending] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Queries
  const historyParams = useMemo(() => ({
    page: historyPage,
    per_page: 15,
    ...historyFilters,
    mois: historyFilters.mois === 'all' ? undefined : historyFilters.mois,
    sort_by: sortBy,
    sort_dir: sortDir,
  }), [historyPage, historyFilters, sortBy, sortDir]);

  const { data: historyData, isLoading: isHistoryLoading } = useGetLiquidationsQuery(historyParams, { skip: activeTab !== 'history' });
  const historyLiquidations = historyData?.data || [];

  const { data: pendingData, isLoading: isPendingLoading, refetch: refetchPending } = useGetPendingLiquidationsQuery(pendingFilters, { skip: activeTab !== 'pending' });
  const pendingLiquidations = pendingData?.data || [];

  const [createLiquidation, { isLoading: isCreating }] = useCreateLiquidationMutation();

  const handleHistoryFilterChange = (key, value) => {
    setHistoryFilters(prev => ({ ...prev, [key]: value }));
    setHistoryPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handlePendingFilterChange = (key, value) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenDetail = (item) => {
    setSelectedPending(item);
    setIsDetailOpen(true);
  };

  const handleConfirmLiquidation = async () => {
    if (!selectedPending) return;
    try {
      await createLiquidation({
        proprietaire_id: selectedPending.proprietaire.id,
        mois: pendingFilters.mois,
        annee: pendingFilters.annee,
      }).unwrap();
      
      toast({
        title: "Succès",
        description: "Liquidation validée avec succès.",
        variant: "default",
      });
      setIsDetailOpen(false);
      setSelectedPending(null);
      refetchPending();
    } catch (err) {
      console.error("Creation failed", err);
      toast({
        title: "Erreur",
        description: err.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const months = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Liquidations</h1>
          <p className="text-slate-500">Gérez les versements aux propriétaires</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="pending">À Liquider</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Période de calcul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Mois</Label>
                  <Select 
                    value={pendingFilters.mois} 
                    onValueChange={(v) => handlePendingFilterChange('mois', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Input 
                    type="number" 
                    value={pendingFilters.annee} 
                    onChange={(e) => handlePendingFilterChange('annee', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Propriétaire</TableHead>
                    <TableHead className="text-right">Total Loyer</TableHead>
                    <TableHead className="text-right">Charges</TableHead>
                    <TableHead className="text-right">Honoraires</TableHead>
                    <TableHead className="text-right font-bold">Net à Verser</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPendingLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Calcul en cours...</TableCell>
                    </TableRow>
                  ) : pendingLiquidations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucune liquidation en attente pour cette période.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingLiquidations.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.proprietaire?.nom_raison}
                        </TableCell>
                        <TableCell className="text-right">{Number(item.calcul.total_loyer).toFixed(2)} MAD</TableCell>
                        <TableCell className="text-right text-red-600">-{Number(item.calcul.total_charges).toFixed(2)} MAD</TableCell>
                        <TableCell className="text-right text-orange-600">-{Number(item.calcul.total_honoraires).toFixed(2)} MAD</TableCell>
                        <TableCell className="text-right font-bold text-green-600">{Number(item.calcul.montant_net).toFixed(2)} MAD</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleOpenDetail(item)}>
                            Détails <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtres Historique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Mois</Label>
                  <Select 
                    value={historyFilters.mois} 
                    onValueChange={(v) => handleHistoryFilterChange('mois', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les mois" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Input 
                    type="number" 
                    value={historyFilters.annee} 
                    onChange={(e) => handleHistoryFilterChange('annee', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Propriétaire</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('mois')}>
                      Période {sortBy === 'mois' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('net_a_payer')}>
                      Net Versé {sortBy === 'net_a_payer' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                      Date {sortBy === 'created_at' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                    </TableRow>
                  ) : historyLiquidations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune liquidation trouvée</TableCell>
                    </TableRow>
                  ) : (
                    historyLiquidations.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell className="font-medium">
                          {liq.proprietaire?.nom_raison}
                        </TableCell>
                        <TableCell>
                          {months.find(m => m.value == liq.mois)?.label} {liq.annee}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">{Number(liq.montant_net).toFixed(2)} MAD</TableCell>
                        <TableCell>{new Date(liq.date_liquidation).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={liq.statut === 'valide' ? 'default' : 'secondary'}>
                            {liq.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de la Liquidation</DialogTitle>
          </DialogHeader>
          {selectedPending && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">
                  {selectedPending.proprietaire.nom_raison}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Période: {months.find(m => m.value == pendingFilters.mois)?.label} {pendingFilters.annee}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-slate-600">Total Loyers Encaissés</span>
                  <span className="font-medium">{Number(selectedPending.calcul.total_loyer).toFixed(2)} MAD</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b text-orange-700">
                  <span className="flex items-center gap-2">
                    Honoraires de Gestion ({selectedPending.calcul.taux_applique}%)
                  </span>
                  <span className="font-medium">-{Number(selectedPending.calcul.total_honoraires).toFixed(2)} MAD</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b text-red-700">
                  <span>Charges / Dépenses</span>
                  <span className="font-medium">-{Number(selectedPending.calcul.total_charges).toFixed(2)} MAD</span>
                </div>

                <div className="flex justify-between items-center py-4 bg-green-50 px-4 rounded-lg border border-green-100">
                  <span className="font-bold text-green-900">Net à Verser</span>
                  <span className="font-bold text-xl text-green-700">{Number(selectedPending.calcul.montant_net).toFixed(2)} MAD</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Annuler</Button>
                <Button onClick={handleConfirmLiquidation} disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                  {isCreating ? (
                    <>Validation...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Confirmer la Liquidation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
