import { useState, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Combobox } from '../components/ui/combobox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { useGetMeQuery, useGetAllBauxWithPaiementsQuery } from '../api/baseApi';
import PaiementModal from '../components/PaiementModal';
import PaiementDetailModal from '../components/PaiementDetailModal';

export default function PaiementsLocataires() {
  const { data: me } = useGetMeQuery();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  });
  const [paiementModal, setPaiementModal] = useState({ open: false, bail: null, period: null });
  const [detailModal, setDetailModal] = useState({ open: false, paiement: null });
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [filterProprietaire, setFilterProprietaire] = useState('tous');
  const [filterLocataire, setFilterLocataire] = useState('tous');
  const [filterUnite, setFilterUnite] = useState('tous');

  const canView = me?.permissions?.includes('paiements.view');
  const canCreate = me?.permissions?.includes('paiements.create');

  // Fetch all baux with paiements in one call
  const { data: bauxData, isLoading, error } = useGetAllBauxWithPaiementsQuery(undefined, { skip: !canView });

  // Extract unique proprietaires, locataires and unites for filters
  const { proprietaires, locataires, unites } = useMemo(() => {
    if (!bauxData?.data) return { proprietaires: [], locataires: [], unites: [] };
    const propsMap = new Map();
    const locatairesMap = new Map();
    const unitesMap = new Map();
    
    bauxData.data.forEach(bail => {
      // Proprietaires
      bail.unite?.proprietaires?.forEach(pr => {
        const key = pr.id;
        if (!propsMap.has(key)) {
          const label = `${pr.nom_raison || pr.nom_complet}${pr.cin ? ` (CIN: ${pr.cin})` : pr.ice ? ` (ICE: ${pr.ice})` : ''}`;
          propsMap.set(key, { value: pr.nom_raison || pr.nom_complet, label });
        }
      });
      
      // Locataires
      if (bail.locataire) {
        const loc = bail.locataire;
        const key = loc.id;
        if (!locatairesMap.has(key)) {
          const name = loc.raison_sociale || `${loc.prenom || ''} ${loc.nom || ''}`.trim();
          const label = `${name}${loc.cin ? ` (CIN: ${loc.cin})` : loc.ice ? ` (ICE: ${loc.ice})` : ''}`;
          locatairesMap.set(key, { value: name, label });
        }
      }
      
      // Unites
      if (bail.unite) {
        const u = bail.unite;
        const key = u.id;
        if (!unitesMap.has(key)) {
          const ref = u.numero_unite || u.reference;
          const label = `${ref}${u.adresse ? ` - ${u.adresse}` : ''}${u.ville ? `, ${u.ville}` : ''}`;
          unitesMap.set(key, { value: ref, label });
        }
      }
    });
    
    return {
      proprietaires: Array.from(propsMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      locataires: Array.from(locatairesMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      unites: Array.from(unitesMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [bauxData]);

  const rows = useMemo(() => {
    if (!bauxData?.data) return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    return bauxData.data
      .filter(bail => bail && bail.id) // Filter out invalid entries
      .map(bail => {
        const paiements = bail.paiements || [];
        const p = paiements.find(x => x.period_year === year && x.period_month === month);
        const isPaid = p && p.status === 'valide';
        const ownerName = bail.unite?.proprietaires?.map(pr => pr.nom_raison || pr.nom_complet).join(', ') || '-';
        const uniteName = bail.unite?.numero_unite || bail.unite?.reference || '-';
        const locataireName = bail.locataire?.nom || bail.locataire?.raison_sociale || '-';
        return {
          bail,
          bail_id: bail.id,
          reference: bail.numero_bail || `Bail#${bail.id}`,
          proprietaire: ownerName,
          unite: uniteName,
          locataire: locataireName,
          month: selectedMonth,
          paiement: p,
          is_paid: isPaid,
        };
      })
      .filter(row => {
        // Filtre par recherche globale (bail, locataire, unité, propriétaire, CIN, ICE, adresse)
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const locataireCin = row.bail.locataire?.cin || '';
          const locataireIce = row.bail.locataire?.ice || '';
          const proprietairesCins = row.bail.unite?.proprietaires?.map(p => p.cin || '').join(' ');
          const proprietairesIces = row.bail.unite?.proprietaires?.map(p => p.ice || '').join(' ');
          const uniteAdresse = row.bail.unite?.adresse || '';
          const uniteVille = row.bail.unite?.ville || '';
          
          const matchSearch = 
            row.reference.toLowerCase().includes(term) ||
            row.locataire.toLowerCase().includes(term) ||
            row.unite.toLowerCase().includes(term) ||
            row.proprietaire.toLowerCase().includes(term) ||
            locataireCin.toLowerCase().includes(term) ||
            locataireIce.toLowerCase().includes(term) ||
            proprietairesCins.toLowerCase().includes(term) ||
            proprietairesIces.toLowerCase().includes(term) ||
            uniteAdresse.toLowerCase().includes(term) ||
            uniteVille.toLowerCase().includes(term);
          if (!matchSearch) return false;
        }
        // Filtre par statut de paiement
        if (filterStatut === 'paye' && !row.is_paid) return false;
        if (filterStatut === 'impaye' && row.is_paid) return false;
        // Filtre par propriétaire
        if (filterProprietaire !== 'tous' && row.proprietaire !== filterProprietaire) return false;
        // Filtre par locataire
        if (filterLocataire !== 'tous' && row.locataire !== filterLocataire) return false;
        // Filtre par unité
        if (filterUnite !== 'tous' && row.unite !== filterUnite) return false;
        return true;
      })
      .sort((a,b) => (a.is_paid ? 1 : 0) - (b.is_paid ? 1 : 0));
  }, [bauxData, selectedMonth, searchTerm, filterStatut, filterProprietaire, filterLocataire, filterUnite]);

  const stats = useMemo(() => {
    const total = rows.length;
    const payes = rows.filter(r => r.is_paid).length;
    const impayes = total - payes;
    const montantTotal = rows.reduce((sum, r) => {
      const montant = Number(r.bail.montant_loyer || r.bail.loyer_total || 0) + Number(r.bail.charges || 0);
      return sum + montant;
    }, 0);
    const montantPaye = rows.filter(r => r.is_paid).reduce((sum, r) => {
      const montant = Number(r.bail.montant_loyer || r.bail.loyer_total || 0) + Number(r.bail.charges || 0);
      return sum + montant;
    }, 0);
    return { total, payes, impayes, montantTotal, montantPaye };
  }, [rows]);

  const openPaiementModal = (bail, year, month) => {
    setPaiementModal({ open: true, bail, period: { year, month } });
  };

  const closePaiementModal = () => {
    setPaiementModal({ open: false, bail: null, period: null });
  };

  const openDetailModal = (paiement) => {
    setDetailModal({ open: true, paiement });
  };

  const closeDetailModal = () => {
    setDetailModal({ open: false, paiement: null });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Paiements locataires</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Total baux</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Payés</div>
            <div className="text-2xl font-bold text-green-600">{stats.payes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Impayés</div>
            <div className="text-2xl font-bold text-red-600">{stats.impayes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Montant total</div>
            <div className="text-xl font-bold">{stats.montantTotal.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Montant payé</div>
            <div className="text-xl font-bold text-green-600">{stats.montantPaye.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Mois</label>
              <Input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Recherche globale</label>
              <Input 
                placeholder="Bail, CIN, ICE, adresse..." 
                value={searchTerm} 
                onChange={e=>setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Statut</label>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                  <SelectItem value="impaye">Impayé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Propriétaire</label>
              <Combobox
                value={filterProprietaire}
                onValueChange={setFilterProprietaire}
                options={[{ value: 'tous', label: 'Tous les propriétaires' }, ...proprietaires]}
                placeholder="Tous les propriétaires"
                searchPlaceholder="Rechercher propriétaire..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Locataire</label>
              <Combobox
                value={filterLocataire}
                onValueChange={setFilterLocataire}
                options={[{ value: 'tous', label: 'Tous les locataires' }, ...locataires]}
                placeholder="Tous les locataires"
                searchPlaceholder="Rechercher locataire..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Unité</label>
              <Combobox
                value={filterUnite}
                onValueChange={setFilterUnite}
                options={[{ value: 'tous', label: 'Toutes les unités' }, ...unites]}
                placeholder="Toutes les unités"
                searchPlaceholder="Rechercher unité..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Chargement…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Erreur lors du chargement des paiements</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left border-b">
                    <th className="py-3 px-4 font-semibold">Référence bail</th>
                    <th className="py-3 px-4 font-semibold">Propriétaire</th>
                    <th className="py-3 px-4 font-semibold">Unité</th>
                    <th className="py-3 px-4 font-semibold">Locataire</th>
                    <th className="py-3 px-4 font-semibold">Montant</th>
                    <th className="py-3 px-4 font-semibold">Statut</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Aucun bail trouvé pour ce mois
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const [year, month] = row.month.split('-').map(Number);
                      const montant = Number(row.bail.montant_loyer || row.bail.loyer_total || 0) + Number(row.bail.charges || 0);
                      
                      // Filter charges for the selected month
                      const chargesForMonth = (row.bail.charges_locataire || []).filter(charge => {
                        if (!charge.created_at) return false;
                        const chargeDate = new Date(charge.created_at);
                        return chargeDate.getFullYear() === year && (chargeDate.getMonth() + 1) === month;
                      });
                      
                      return (
                        <Fragment key={`${row.bail_id}-${row.month}`}>
                          <tr className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <Link to={`/baux/${row.bail_id}`} className="text-blue-600 hover:underline font-medium">
                                {row.reference}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{row.proprietaire}</td>
                            <td className="py-3 px-4">{row.unite}</td>
                            <td className="py-3 px-4">{row.locataire}</td>
                            <td className="py-3 px-4 font-medium">{montant.toLocaleString()} MAD</td>
                            <td className="py-3 px-4">
                              {row.is_paid ? (
                                <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                                  <i className="bi bi-check-circle-fill mr-1"></i>
                                  Payé
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
                                  <i className="bi bi-exclamation-circle-fill mr-1"></i>
                                  Impayé
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {row.is_paid ? (
                                <button
                                  onClick={() => openDetailModal(row.paiement)}
                                  title="Voir détails du paiement"
                                  className="inline-flex items-center text-green-700 hover:text-green-900"
                                >
                                  <i className="bi bi-eye text-lg" />
                                </button>
                              ) : (
                                canCreate ? (
                                  <button
                                    onClick={() => openPaiementModal(row.bail, year, month)}
                                    title="Enregistrer paiement"
                                    className="inline-flex items-center text-orange-700 hover:text-orange-900"
                                  >
                                    <i className="bi bi-cash-coin text-lg" />
                                  </button>
                                ) : (
                                  <span className="text-gray-400"><i className="bi bi-lock" /></span>
                                )
                              )}
                            </td>
                          </tr>
                          {chargesForMonth.length > 0 && (
                            <tr className="bg-blue-50 border-b">
                              <td colSpan="7" className="py-2 px-4">
                                <div className="text-xs">
                                  <div className="font-semibold text-blue-900 mb-1 flex items-center">
                                    <i className="bi bi-receipt mr-2"></i>
                                    Charges du locataire pour ce mois:
                                  </div>
                                  <div className="space-y-1 ml-6">
                                    {chargesForMonth.map(charge => (
                                      <div key={charge.id} className="flex items-center justify-between text-slate-700">
                                        <span>
                                          <strong>{charge.titre}</strong>
                                          {charge.notes && <span className="text-slate-500"> - {charge.notes}</span>}
                                        </span>
                                        <span className="flex items-center gap-2">
                                          <Badge className={charge.statut_paiement === 'paye' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                            {charge.statut_paiement === 'paye' ? 'Payé' : 'En attente'}
                                          </Badge>
                                          <span className="font-medium">{Number(charge.montant).toLocaleString()} MAD</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <PaiementModal
        open={paiementModal.open}
        onClose={closePaiementModal}
        bail={paiementModal.bail}
        period={paiementModal.period}
      />

      <PaiementDetailModal
        open={detailModal.open}
        onClose={closeDetailModal}
        paiement={detailModal.paiement}
      />
    </div>
  );
}
