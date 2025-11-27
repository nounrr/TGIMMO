import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthz from '@/hooks/useAuthz';
import { useGetProprietairesQuery, useGetUniteOwnerGroupsQuery, useSaveUniteOwnerGroupMutation, useGetMandatsQuery, useUpdateMandatMutation, useUpdateUniteOwnerGroupStatusMutation, useGetAvenantsQuery } from '../api/baseApi';
import GenerationResultModal from '../components/GenerationResultModal';
import ManualDocsWizard from '../components/ManualDocsWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users as UsersIcon, CalendarDays, Plus, Trash2 } from 'lucide-react';

export default function UniteOwners() {
  const { can } = useAuthz();
  const { uniteId } = useParams();
  const navigate = useNavigate();
  const { data: ownersListData } = useGetProprietairesQuery();
  const { data: groups, isFetching, refetch } = useGetUniteOwnerGroupsQuery(uniteId);
  const { data: mandatsData } = useGetMandatsQuery({ unite_id: uniteId });
  const { data: avenantsData } = useGetAvenantsQuery({ per_page: 200 });
  const [saveGroup, { isLoading: isSaving }] = useSaveUniteOwnerGroupMutation();
  const [updateMandat] = useUpdateMandatMutation();
  const [updateOwnershipStatus] = useUpdateUniteOwnerGroupStatusMutation();

  const canView = can('unites.ownership.view');
  const canManage = can('unites.ownership.manage');

  const proprietaires = ownersListData?.data || ownersListData || [];
  const mandats = mandatsData?.data || mandatsData || [];
  const avenants = avenantsData?.data || avenantsData || [];

  const ownersById = useMemo(() => {
    const map = {};
    for (const p of proprietaires) map[p.id] = p;
    return map;
  }, [proprietaires]);

  const activeGroup = useMemo(() => {
    if (!groups || !Array.isArray(groups) || groups.length === 0) return null;
    const current = groups.find(g => !g.date_fin);
    if (current) return current;
    const sorted = [...groups].sort((a,b) => new Date(b.date_debut) - new Date(a.date_debut));
    return sorted[0] || null;
  }, [groups]);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [rows, setRows] = useState([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
  const [showModal, setShowModal] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [showManualWizard, setShowManualWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState('mandat'); // 'mandat' or 'avenant'
  const [activeMandatId, setActiveMandatId] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [editingMandatId, setEditingMandatId] = useState(null);
  const [statusEditMandatId, setStatusEditMandatId] = useState(null);
  const [statusEditValue, setStatusEditValue] = useState('');
  const [statusEditGroupKey, setStatusEditGroupKey] = useState(null);
  const [statusEditGroupValue, setStatusEditGroupValue] = useState('');

  const { total, totalPct, isValidTotal, errors } = useMemo(() => {
    let sum = 0; const validationErrors = [];
    rows.forEach((r, idx) => {
      const num = Number(r.part_numerateur || 0);
      const den = Number(r.part_denominateur || 1);
      if (num <= 0) validationErrors.push(`Ligne ${idx + 1}: numérateur > 0 requis`);
      if (den <= 0) validationErrors.push(`Ligne ${idx + 1}: dénominateur > 0 requis`);
      if (den > 0 && num > den) validationErrors.push(`Ligne ${idx + 1}: numérateur ≤ dénominateur`);
      if (den > 0 && num > 0) sum += num / den;
    });
    return {
      total: sum,
      totalPct: (sum * 100).toFixed(4),
      isValidTotal: Math.abs(sum - 1) < 0.0001 && validationErrors.length === 0,
      errors: validationErrors
    };
  }, [rows]);

  const addRow = () => {
    const newRows = [...rows, { proprietaire_id: '', part_numerateur: 1, part_denominateur: rows.length + 1 }];
    const count = newRows.length;
    setRows(newRows.map(r => ({ ...r, part_numerateur: 1, part_denominateur: count })));
  };

  const removeRow = (idx) => {
    const filtered = rows.filter((_, i) => i !== idx);
    if (!filtered.length) return setRows(filtered);
    const count = filtered.length;
    setRows(filtered.map(r => ({ ...r, part_numerateur: 1, part_denominateur: count })));
  };

  const updateRow = (idx, patch) => {
    const updated = rows.map((r,i)=> i===idx ? { ...r, ...patch } : r);
    if ((patch.part_numerateur !== undefined || patch.part_denominateur !== undefined) && rows.length === 2) {
      const other = idx === 0 ? 1 : 0;
      const changed = updated[idx];
      const num = Number(changed.part_numerateur || 0);
      const den = Number(changed.part_denominateur || 1);
      if (num > 0 && den > 0 && den >= num) {
        const remainingFraction = 1 - num/den;
        if (remainingFraction >= 0 && remainingFraction <= 1) {
          const remainingNum = Math.round(remainingFraction * den);
          updated[other] = { ...updated[other], part_numerateur: remainingNum, part_denominateur: den };
        }
      }
    }
    setRows(updated);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setSubmitError(null);
    if (!isValidTotal) return;
    
    // Check if we are editing the active period
    const isEditing = isEditingActive || (activeGroup && activeGroup.date_debut === dateDebut);

    if (!isEditing && activeGroup && !activeGroup.date_fin && dateDebut !== activeGroup.date_debut) {
      setSubmitError('Une période active existe déjà. Chargez-la avant de créer une nouvelle période.');
      return;
    }
    const cleanRows = rows.filter(r => r.proprietaire_id);
    if (!isEditing && activeGroup && !activeGroup.date_fin && activeGroup.date_debut === dateDebut) {
      if (activeGroup.owners?.length === 1 && cleanRows.length === 1 && activeGroup.owners[0].proprietaire_id !== Number(cleanRows[0].proprietaire_id)) {
        setSubmitError('Ajoutez le nouveau propriétaire puis répartissez les parts (ex: 1/2 et 1/2).');
        return;
      }
    }

    // Check for mandate overlaps if creating a new period
    if (!isEditing) {
       const overlappingMandat = mandats.find(m => {
          if (m.statut === 'annule') return false;
          const mStart = m.date_debut;
          const mEnd = m.date_fin;
          const nStart = dateDebut;
          const nEnd = dateFin;
          
          // Check overlap: (StartA <= EndB) and (EndA >= StartB)
          // Treat null as infinity
          const startOverlap = !mEnd || mEnd >= nStart;
          const endOverlap = !nEnd || nEnd >= mStart;
          
          return startOverlap && endOverlap;
       });

       if (overlappingMandat) {
          setSubmitError(`Conflit: Le mandat #${overlappingMandat.id} (${overlappingMandat.date_debut} au ${overlappingMandat.date_fin || 'Indéfini'}) couvre déjà cette période. Veuillez le clôturer ou modifier les dates.`);
          return;
       }
    }

    const payload = {
      unite_id: Number(uniteId),
      date_debut: dateDebut,
      original_date_debut: originalDateDebut,
      date_fin: dateFin || null,
      owners: cleanRows.map(r => ({
        id: r.id ?? null,
        proprietaire_id: Number(r.proprietaire_id),
        part_numerateur: Number(r.part_numerateur),
        part_denominateur: Number(r.part_denominateur)
      })),
      generate_documents: false
    };
    try {
      // Logic for mandate update / avenant creation
      // We look for a mandate that overlaps with the period [dateDebut, dateFin]
      // This handles both "Editing" (finding the mandate we are editing) and "New" (checking if we should attach to existing)
      
      let matchingMandat = null;
      if (editingMandatId) {
          matchingMandat = mandats.find(m => m.id === editingMandatId);
      }
      
      if (!matchingMandat) {
        matchingMandat = mandats.find(m => {
            if (m.statut === 'annule') return false;
            const mStart = m.date_debut;
            const mEnd = m.date_fin || '9999-12-31';
            const pStart = dateDebut;
            const pEnd = dateFin || '9999-12-31';
            // Overlap if (StartA <= EndB) and (EndA >= StartB)
            return (mEnd >= pStart && pEnd >= mStart);
        });
      }

      // If we're editing the active period, always perform a direct sync update
      if (isEditingActive) {
        // On edit, branch by mandat status: active -> avenant flow; otherwise -> mandat edit flow
        if (matchingMandat && ['actif','signe'].includes(matchingMandat.statut)) {
          const extendedPayload = {
            ...payload,
            mandat_id: matchingMandat.id,
            apply_modifier_status: true,
          };
          setPendingPayload(extendedPayload);
          setWizardMode('avenant');
          setActiveMandatId(matchingMandat.id);
          setShowManualWizard(true);
        } else if (matchingMandat) {
          const payloadWithMandat = { ...payload, mandat_id: matchingMandat.id };
          setPendingPayload(payloadWithMandat);
          setWizardMode('mandat');
          setActiveMandatId(matchingMandat.id);
          setShowManualWizard(true);
        } else {
          // No mandat found, default to mandat creation flow
          setPendingPayload(payload);
          setWizardMode('mandat');
          setShowManualWizard(true);
        }
      } else if (matchingMandat) {
          if (['actif', 'signe'].includes(matchingMandat.statut)) {
            // Mandat validated -> Create Avenant -> Wizard
            const extendedPayload = {
                ...payload,
                mandat_id: matchingMandat.id,
                apply_modifier_status: true
            };
            setPendingPayload(extendedPayload);
            setWizardMode('avenant');
            setActiveMandatId(matchingMandat.id);
            setShowManualWizard(true);
          } else {
            // Mandat draft/validation -> Update Mandat directly
            const payloadWithMandat = { ...payload, mandat_id: matchingMandat.id };
            await saveGroup({ uniteId, payload: payloadWithMandat }).unwrap();
            
            const updatePayload = {
              date_debut: dateDebut,
              date_fin: dateFin || matchingMandat.date_fin,
            };
            if (cleanRows.length === 1) {
              updatePayload.proprietaire_id = Number(cleanRows[0].proprietaire_id);
            }
            await updateMandat({ id: matchingMandat.id, payload: updatePayload }).unwrap();
            refetch();
          }
      } else {
        // New period -> Create Mandat -> Wizard
        setPendingPayload(payload);
        setWizardMode('mandat');
        setShowManualWizard(true);
      }
    } catch (err) {
      setSubmitError(err?.data?.message || err?.message || 'Erreur inconnue');
    }
  };

  const handleBeforeSaveMandate = async () => {
    if (!pendingPayload) return;
    await saveGroup({ uniteId, payload: pendingPayload }).unwrap();
    refetch();
  };

  const startEditMandatStatus = (mandat) => {
    if (!mandat) return;
    setStatusEditMandatId(mandat.id);
    setStatusEditValue(mandat.statut || 'brouillon');
  };

  const saveMandatStatus = async (mandat) => {
    try {
      await updateMandat({
        id: mandat.id,
        payload: {
          unite_id: Number(uniteId),
          date_debut: mandat.date_debut,
          date_fin: mandat.date_fin,
          assiette_honoraires: mandat.assiette_honoraires || 'loyers_encaisse',
          statut: statusEditValue,
        }
      }).unwrap();
      setStatusEditMandatId(null);
      refetch();
    } catch (e) {
      console.error(e);
      setSubmitError(e?.data?.message || e?.message || 'Erreur mise à jour du statut du mandat');
    }
  };

  const [originalDateDebut, setOriginalDateDebut] = useState(null);

  const loadActive = (groupToLoad = activeGroup) => {
    if (!groupToLoad) return;
    setIsEditingActive(true);
    const newRows = (groupToLoad.owners || []).map(o => ({
      id: o.id,
      proprietaire_id: o.proprietaire_id,
      part_numerateur: o.part_numerateur,
      part_denominateur: o.part_denominateur
    }));
    setRows(newRows.length ? newRows : [{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
    setDateDebut(groupToLoad.date_debut);
    setOriginalDateDebut(groupToLoad.date_debut);
    setDateFin(groupToLoad.date_fin || '');
    setEditingMandatId(groupToLoad.mandat_id || null);
  };

  const ownersForWizard = useMemo(() => {
    return rows.filter(r => r.proprietaire_id).map(r => {
      const p = ownersById[r.proprietaire_id];
      return {
        id: r.proprietaire_id,
        nom: p?.nom_raison || p?.email || `#${r.proprietaire_id}`,
        parts: `${r.part_numerateur}/${r.part_denominateur}`
      };
    });
  }, [rows, ownersById]);

  const overlappingActiveMandat = useMemo(() => {
    if (!dateDebut) return null;
    return mandats.find(m => {
        if (m.statut === 'annule') return false;
        const mStart = m.date_debut;
        const mEnd = m.date_fin || '9999-12-31';
        const pStart = dateDebut;
        const pEnd = dateFin || '9999-12-31';
        const isOverlap = (mEnd >= pStart && pEnd >= mStart);
        return isOverlap && ['actif', 'signe'].includes(m.statut);
    });
  }, [mandats, dateDebut, dateFin]);

  if (!canView) {
    return <div className="p-6 text-center text-slate-500">Vous n'avez pas la permission de voir les propriétaires.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
          <UsersIcon className="h-6 w-6 text-indigo-600" /> Répartition des propriétaires
        </h1>
        <span className="text-sm text-slate-500">Unité #{uniteId}</span>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Historique des périodes</CardTitle></CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="py-6 text-center text-slate-500">Chargement…</div>
          ) : (groups || []).length === 0 ? (
            <div className="py-6 text-center text-slate-500">Aucune période enregistrée</div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Propriétaires et parts</TableHead>
                    <TableHead>Mandat</TableHead>
                    <TableHead>Avenant</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(groups || []).map((g, idx) => {
                    let matchingMandat = mandats.find(m => {
                        if (m.statut === 'annule') return false;
                        const mStart = m.date_debut;
                        const mEnd = m.date_fin || '9999-12-31';
                        const gStart = g.date_debut;
                        const gEnd = g.date_fin || '9999-12-31';
                        return (mEnd >= gStart && gEnd >= mStart);
                    });
                    // Use explicit mandat_id from group if available
                    const groupMandatId = g.mandat_id || matchingMandat?.id || null;
                    if (!matchingMandat && groupMandatId) {
                      matchingMandat = mandats.find(m => m.id === groupMandatId);
                    }
                    // Find avenant for this mandat: prefer same-period start, else latest by date
                    let matchingAvenant = null;
                    if (groupMandatId) {
                      const avenantsForMandat = avenants.filter(a => a.mandat_id === groupMandatId);
                      if (avenantsForMandat.length > 0) {
                        matchingAvenant = avenantsForMandat.find(a => {
                          const aStart = a.date_effet || a.date_debut || a.date_pouvoir_initial;
                          return aStart && aStart === g.date_debut;
                        }) || [...avenantsForMandat].sort((a,b) => {
                          const getDate = (x) => x.date_effet || x.date_debut || x.date_pouvoir_initial || '0000-00-00';
                          return getDate(b).localeCompare(getDate(a));
                        })[0];
                      }
                    } else {
                      // Fallback: original behavior based on period start
                      matchingAvenant = avenants.find(a => {
                        const aStart = a.date_effet || a.date_debut || a.date_pouvoir_initial;
                        return aStart && aStart === g.date_debut;
                      });
                    }
                    // Fallback: if avenant found but mandat not matched by overlap, fetch its mandat directly
                    if (!matchingMandat && matchingAvenant) {
                      matchingMandat = mandats.find(m => m.id === matchingAvenant.mandat_id);
                    }
                    return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-0 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {g.date_debut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {g.date_fin ? (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-0 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> {g.date_fin}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {g.statut === 'modifier' ? (
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-0">Modifier</Badge>
                          ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-0">Actif</Badge>
                          )}
                          {can('unites-proprietaires.status.modifier') && (
                            statusEditGroupKey === `${g.date_debut}|${g.statut || 'actif'}` ? (
                              <div className="flex items-center gap-1">
                                <select
                                  className="text-xs bg-white border border-slate-300 rounded px-1 py-0.5"
                                  value={statusEditGroupValue}
                                  onChange={(e)=>setStatusEditGroupValue(e.target.value)}
                                >
                                  <option value="actif">actif</option>
                                  <option value="modifier">modifier</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-emerald-600"
                                  title="Enregistrer"
                                  onClick={async () => {
                                    try {
                                      await updateOwnershipStatus({
                                        uniteId,
                                        payload: {
                                          date_debut: g.date_debut,
                                          current_statut: g.statut || 'actif',
                                          new_statut: statusEditGroupValue,
                                        }
                                      }).unwrap();
                                      setStatusEditGroupKey(null);
                                      refetch();
                                    } catch (e) {
                                      console.error(e);
                                      setSubmitError(e?.data?.message || e?.message || 'Erreur mise à jour du statut de la période');
                                    }
                                  }}
                                >
                                  <i className="bi bi-check-lg"></i>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600"
                                  title="Annuler"
                                  onClick={() => setStatusEditGroupKey(null)}
                                >
                                  <i className="bi bi-x-lg"></i>
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Modifier le statut de la période"
                                onClick={() => { setStatusEditGroupKey(`${g.date_debut}|${g.statut || 'actif'}`); setStatusEditGroupValue(g.statut || 'actif'); }}
                              >
                                <i className="bi bi-pencil-square text-slate-600"></i>
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {(g.owners || []).map((o, i) => {
                            const p = ownersById[o.proprietaire_id];
                            const label = p?.nom_raison || p?.email || `#${o.proprietaire_id}`;
                            const pct = typeof o.part_pourcent === 'number' ? o.part_pourcent.toFixed(2) : o.part_pourcent;
                            return (
                              <Badge key={i} variant="outline" className="bg-emerald-100 text-emerald-700 border-0">
                                {label}: {o.part_numerateur}/{o.part_denominateur} ({pct}%)
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {matchingMandat ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={
                                matchingMandat.statut === 'brouillon'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : ['actif','signe'].includes(matchingMandat.statut)
                                    ? 'bg-purple-100 text-purple-700 border-0'
                                    : 'bg-slate-100 text-slate-700 border-0'
                              }
                            >
                              Mandat #{matchingMandat.numero_mandat || matchingMandat.id} ({matchingMandat.statut})
                            </Badge>
                            {!['actif','resilie'].includes(matchingMandat.statut) && statusEditMandatId === matchingMandat.id && (
                              <div className="flex items-center gap-1">
                                <select
                                  className="text-xs bg-white border border-slate-300 rounded px-1 py-0.5"
                                  value={statusEditValue}
                                  onChange={(e)=>setStatusEditValue(e.target.value)}
                                >
                                  <option value="brouillon">brouillon</option>
                                  <option value="en_validation">en_validation</option>
                                  <option value="signe">signe</option>
                                  <option value="actif">actif</option>
                                  <option value="resilie">resilie</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-emerald-600"
                                  title="Enregistrer"
                                  onClick={() => saveMandatStatus(matchingMandat)}
                                >
                                  <i className="bi bi-check-lg"></i>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600"
                                  title="Annuler"
                                  onClick={() => setStatusEditMandatId(null)}
                                >
                                  <i className="bi bi-x-lg"></i>
                                </Button>
                              </div>
                            )}
                            {!['actif','resilie'].includes(matchingMandat.statut) && statusEditMandatId !== matchingMandat.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Modifier le statut du mandat"
                                onClick={() => startEditMandatStatus(matchingMandat)}
                              >
                                <i className="bi bi-pencil-square text-slate-600"></i>
                              </Button>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {matchingAvenant ? (
                          <Badge
                            variant="outline"
                            className={
                              matchingAvenant.statut === 'brouillon'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : ['actif','signe'].includes(matchingAvenant.statut)
                                  ? 'bg-amber-100 text-amber-700 border-0'
                                  : 'bg-slate-100 text-slate-700 border-0'
                            }
                          >
                            Avenant #{matchingAvenant.id} ({matchingAvenant.statut})
                          </Badge>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {g.statut === 'actif' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Modifier cette période"
                              onClick={() => loadActive(g)}
                            >
                                <i className="bi bi-pencil text-blue-600"></i>
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Ajouter / Remplacer une période</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!canManage && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded text-sm">
              Vous avez un accès en lecture seule.
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date début *</label>
                <Input type="date" value={dateDebut} onChange={(e)=>setDateDebut(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Date fin *</label>
                <Input type="date" value={dateFin} onChange={(e)=>setDateFin(e.target.value)} required />
              </div>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Numérateur</TableHead>
                    <TableHead>Dénominateur</TableHead>
                    <TableHead>Part %</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => {
                    const num = Number(r.part_numerateur || 0);
                    const den = Number(r.part_denominateur || 1);
                    const pct = den > 0 && num > 0 ? ((num/den)*100).toFixed(2) : '0.00';
                    const hasError = num <= 0 || den <= 0 || num > den;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <select
                            className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 w-56"
                            value={r.proprietaire_id}
                            onChange={(e)=>updateRow(idx,{ proprietaire_id: e.target.value })}
                            required
                          >
                            <option value="">Choisir…</option>
                            {proprietaires.map(p => (
                              <option key={p.id} value={p.id}>{p.nom_raison || p.email || `#${p.id}`}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={r.part_numerateur}
                                 onChange={(e)=>updateRow(idx,{ part_numerateur: e.target.value })}
                                 className={hasError ? 'border-red-500' : ''} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={r.part_denominateur}
                                 onChange={(e)=>updateRow(idx,{ part_denominateur: e.target.value })}
                                 className={hasError ? 'border-red-500' : ''} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={hasError ? 'bg-red-100 text-red-700 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={()=>removeRow(idx)} className="text-red-600 hover:bg-red-50" title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="p-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" /> Ajouter un propriétaire
                </Button>
              </div>
            </div>
            <div className={`text-sm rounded-md p-3 ${isValidTotal ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <strong>Total:</strong> {totalPct}% {isValidTotal ? '(OK)' : '(Doit = 100%)'}
              {errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {errors.map((er,i)=>(<li key={i}>{er}</li>))}
                </ul>
              )}
            </div>
            {submitError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{submitError}</div>}
            <div className="flex gap-2">
              {canManage && (
                <Button type="submit" disabled={!isValidTotal || isSaving} className="gap-2">
                  {isSaving ? 'Enregistrement…' : (overlappingActiveMandat ? 'Créer nouvelle version' : (isEditingActive ? 'Modifier' : 'Enregistrer'))}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={()=>{
                setRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
                setDateDebut(''); setDateFin(''); setSubmitError(null); setIsEditingActive(false); setEditingMandatId(null);
              }}>Réinitialiser</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <GenerationResultModal
        open={showModal}
        items={modalItems}
        onClose={() => {
          setShowModal(false); setModalItems([]);
          setRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
          setDateDebut(''); setDateFin(''); setIsEditingActive(false); refetch();
        }}
        onGotoMandats={() => navigate('/mandats')}
        onGotoAvenants={() => navigate('/avenants')}
      />
      <ManualDocsWizard
        open={showManualWizard}
        onClose={(isSuccess) => {
          setShowManualWizard(false);
          if (isSuccess) {
            setRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
            setDateDebut(''); setDateFin(''); setIsEditingActive(false); refetch();
            setPendingPayload(null);
          }
        }}
        proprietaires={proprietaires}
        defaultProprietaireId={rows[0]?.proprietaire_id || ''}
        defaultDateDebut={dateDebut}
        defaultDateFin={dateFin}
        uniteDescription={undefined}
        allowAvenant={true}
        initialMode={wizardMode}
        defaultMandatId={activeMandatId}
        lockCoreFields={true}
        editMandatId={wizardMode === 'mandat' ? activeMandatId : undefined}
        unitOwners={ownersForWizard}
        uniteId={uniteId}
        onBeforeSave={handleBeforeSaveMandate}
        requireAvenantFirst={wizardMode === 'avenant'}
      />
    </div>
  );
}

// Refactored to shadcn components; legacy bootstrap removed.
