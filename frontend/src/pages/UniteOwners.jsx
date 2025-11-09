import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProprietairesQuery, useGetUniteOwnerGroupsQuery, useSaveUniteOwnerGroupMutation } from '../api/baseApi';
import GenerationResultModal from '../components/GenerationResultModal';
import ManualDocsWizard from '../components/ManualDocsWizard';

export default function UniteOwners() {
  const { uniteId } = useParams();
  const navigate = useNavigate();
  const { data: ownersListData } = useGetProprietairesQuery();
  const { data: groups, isFetching, refetch } = useGetUniteOwnerGroupsQuery(uniteId);
  const [saveGroup, { isLoading: isSaving }] = useSaveUniteOwnerGroupMutation();

  const proprietaires = ownersListData?.data || ownersListData || [];
  const ownersById = useMemo(() => {
    const map = {};
    for (const p of proprietaires) map[p.id] = p;
    return map;
  }, [proprietaires]);

  // Déterminer la période active (celle sans date_fin ou la plus récente)
  const activeGroup = useMemo(() => {
    if (!groups || !Array.isArray(groups) || groups.length === 0) return null;
    const current = groups.find(g => !g.date_fin);
    if (current) return current;
    // fallback: dernière par date_debut
    const sorted = [...groups].sort((a,b) => new Date(b.date_debut) - new Date(a.date_debut));
    return sorted[0] || null;
  }, [groups]);

  // Form state for new group
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [rows, setRows] = useState([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
  // Auto-generation is now always enabled (UI removed)
  const [showModal, setShowModal] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [showManualWizard, setShowManualWizard] = useState(false);
  
  // Debug: log modal state changes
  useEffect(() => {
    console.log('Modal state changed:', { open: showModal, itemsCount: modalItems?.length || 0 });
  }, [showModal, modalItems]);
  
  // Calcul du total avec validation
  const { total, totalPct, isValidTotal, errors } = useMemo(() => {
    let sum = 0;
    const validationErrors = [];
    
    rows.forEach((r, idx) => {
      const num = Number(r.part_numerateur || 0);
      const den = Number(r.part_denominateur || 1);
      
      // Validation: numérateur doit être > 0
      if (num <= 0) {
        validationErrors.push(`Ligne ${idx + 1}: Le numérateur doit être supérieur à 0`);
      }
      
      // Validation: dénominateur doit être > 0
      if (den <= 0) {
        validationErrors.push(`Ligne ${idx + 1}: Le dénominateur doit être supérieur à 0`);
      }
      
      // Validation: dénominateur doit être >= numérateur (part ne peut pas dépasser 1)
      if (den > 0 && num > den) {
        validationErrors.push(`Ligne ${idx + 1}: Le dénominateur (${den}) doit être supérieur ou égal au numérateur (${num})`);
      }
      
      // Calcul de la somme si valide
      if (den > 0 && num > 0) {
        sum += num / den;
      }
    });
    
    const percentage = (sum * 100).toFixed(4);
    const isValid = Math.abs(sum - 1) < 0.0001 && validationErrors.length === 0;
    
    return {
      total: sum,
      totalPct: percentage,
      isValidTotal: isValid,
      errors: validationErrors
    };
  }, [rows]);

  const addRow = () => {
    const newRows = [...rows, { proprietaire_id: '', part_numerateur: 1, part_denominateur: rows.length + 1 }];
    // Redistribuer équitablement
    const totalOwners = newRows.length;
    setRows(newRows.map(r => ({ ...r, part_numerateur: 1, part_denominateur: totalOwners })));
  };
  
  const removeRow = (idx) => {
    const filtered = rows.filter((_, i) => i !== idx);
    if (filtered.length > 0) {
      // Redistribuer équitablement après suppression
      const totalOwners = filtered.length;
      setRows(filtered.map(r => ({ ...r, part_numerateur: 1, part_denominateur: totalOwners })));
    } else {
      setRows(filtered);
    }
  };
  
  const updateRow = (idx, patch) => {
    const updatedRows = rows.map((r, i) => i === idx ? { ...r, ...patch } : r);
    
    // Si on change le numérateur ou dénominateur et qu'il y a exactement 2 propriétaires
    // ajuster automatiquement le second
    if ((patch.part_numerateur !== undefined || patch.part_denominateur !== undefined) && rows.length === 2) {
      const otherIdx = idx === 0 ? 1 : 0;
      const changedRow = updatedRows[idx];
      const num = Number(changedRow.part_numerateur || 0);
      const den = Number(changedRow.part_denominateur || 1);
      
      if (num > 0 && den > 0 && den >= num) {
        // Calculer la part restante pour l'autre propriétaire
        const changedFraction = num / den;
        const remainingFraction = 1 - changedFraction;
        
        if (remainingFraction >= 0 && remainingFraction <= 1) {
          // Trouver le numérateur et dénominateur pour la fraction restante
          // Utiliser le même dénominateur si possible
          const remainingNum = Math.round(remainingFraction * den);
          if (remainingNum >= 0 && remainingNum <= den) {
            updatedRows[otherIdx] = {
              ...updatedRows[otherIdx],
              part_numerateur: remainingNum,
              part_denominateur: den
            };
          }
        }
      }
    }
    
    setRows(updatedRows);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValidTotal) return;

    // Règles métier supplémentaires pour éviter plusieurs périodes actives qui se chevauchent
    if (activeGroup && !activeGroup.date_fin) {
      // Empêcher création d'une nouvelle période avec une date différente tant que l'ancienne est ouverte
      if (dateDebut !== activeGroup.date_debut) {
        alert("Une période active existe déjà. Chargez-la et modifiez les parts au lieu de créer une nouvelle période qui chevauche.");
        return;
      }
    }

    const cleanRows = rows.filter(r => r.proprietaire_id);

    // Cas: utilisateur veut ajouter un second propriétaire mais laisse 1/1 sur un seul propriétaire (pas logique si l'intention est d'ajouter)
    if (activeGroup && !activeGroup.date_fin && activeGroup.date_debut === dateDebut) {
      if (activeGroup.owners && activeGroup.owners.length === 1 && cleanRows.length === 1 && activeGroup.owners[0].proprietaire_id === cleanRows[0].proprietaire_id) {
        // même propriétaire seul -> OK (remplacement identique). Rien à faire.
      } else if (activeGroup.owners && activeGroup.owners.length === 1 && cleanRows.length === 1 && activeGroup.owners[0].proprietaire_id !== cleanRows[0].proprietaire_id) {
        alert("Pour ajouter un nouveau propriétaire, ajoutez-le dans la liste et répartissez les parts (ex: 1/2 et 1/2). Un remplacement 1/1 n'est pas autorisé dans ce cas.");
        return;
      }
    }
    const payload = {
      unite_id: Number(uniteId),
      date_debut: dateDebut,
      date_fin: dateFin || null,
      owners: cleanRows.map(r => ({
        proprietaire_id: Number(r.proprietaire_id),
        part_numerateur: Number(r.part_numerateur),
        part_denominateur: Number(r.part_denominateur),
      })),
      // Do not auto-generate on backend; we'll open the wizard to choose and fill
      generate_documents: false,
    };
    
    try {
      await saveGroup({ uniteId, payload }).unwrap();
      // Always open manual wizard to let user choose Mandat / Avenant / Both
      setShowManualWizard(true);
    } catch (error) {
      console.error('Error saving ownership:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error?.data?.message || error?.message || 'Erreur inconnue'));
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="p-3 p-lg-4" style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* Header with back button */}
        <div className="d-flex flex-column gap-3 mb-4">
          <button 
            className="btn btn-link text-decoration-none d-flex align-items-center gap-2 p-0"
            style={{ width: 'fit-content', color: '#6366f1', fontWeight: '500' }}
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Retour aux unités
          </button>
          
          <div>
            <h1 className="h3 fw-bold mb-1" style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Répartition des propriétaires
            </h1>
            <p className="text-muted mb-0">Gestion de la copropriété de l'unité #{uniteId}</p>
          </div>
        </div>

        {/* History Section */}
        <div className="card border-0 shadow-sm rounded-4 mb-4"
             style={{
               background: 'rgba(255, 255, 255, 0.9)',
               backdropFilter: 'blur(20px)'
             }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#4338ca' }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
              Historique des périodes
            </h5>
            
            {isFetching ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : (groups || []).length === 0 ? (
              <div className="text-center py-4">
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                     style={{ width: 60, height: 60, background: 'rgba(99, 102, 241, 0.1)' }}>
                  <svg width="30" height="30" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  </svg>
                </div>
                <p className="text-muted mb-0">Aucune période de propriété enregistrée</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ 
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
                    borderBottom: '2px solid #c7d2fe'
                  }}>
                    <tr>
                      <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>Date début</th>
                      <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>Date fin</th>
                      <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>Propriétaires et parts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(groups || []).map((g, idx) => (
                      <tr key={idx} 
                          style={{ transition: 'all 0.2s ease', borderBottom: '1px solid #e5e7eb' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td className="px-4 py-3">
                          <span className="badge rounded-pill px-3 py-2" style={{ 
                            background: '#dbeafe', 
                            color: '#1e40af',
                            fontWeight: '500'
                          }}>
                            {g.date_debut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {g.date_fin ? (
                            <span className="badge rounded-pill px-3 py-2" style={{ 
                              background: '#fee2e2', 
                              color: '#b91c1c',
                              fontWeight: '500'
                            }}>
                              {g.date_fin}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex flex-wrap gap-2">
                            {(g.owners || []).map((o, i) => {
                              const p = ownersById[o.proprietaire_id];
                              const label = p?.nom_raison || p?.email || `#${o.proprietaire_id}`;
                              const pct = typeof o.part_pourcent === 'number' ? o.part_pourcent.toFixed(2) : o.part_pourcent;
                              return (
                                <span key={i} className="badge rounded-pill px-3 py-2" style={{
                                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                  color: '#065f46',
                                  fontWeight: '500'
                                }}>
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                  </svg>
                                  {label}: {o.part_numerateur}/{o.part_denominateur} ({pct}%)
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden"
             style={{
               background: 'rgba(255, 255, 255, 0.9)',
               backdropFilter: 'blur(20px)'
             }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#4338ca' }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Ajouter / Remplacer une période
            </h5>

            {activeGroup && !showModal && (
              <div className="alert alert-info rounded-3 border-0 shadow-sm mb-3" style={{ background: '#e0f2fe', color: '#0c4a6e' }}>
                <div className="d-flex flex-column gap-1">
                  <strong>Période active en cours depuis le {activeGroup.date_debut}</strong>
                  <small>Pour ajouter un nouveau propriétaire, chargez cette période puis ajustez les parts afin que le total reste à 100%.</small>
                  <div>
                    <button type="button" className="btn btn-sm btn-primary mt-2" onClick={() => {
                      const newRows = (activeGroup.owners || []).map(o => ({
                        proprietaire_id: o.proprietaire_id,
                        part_numerateur: o.part_numerateur,
                        part_denominateur: o.part_denominateur,
                      }));
                      setRows(newRows.length ? newRows : [{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
                      setDateDebut(activeGroup.date_debut);
                      setDateFin(activeGroup.date_fin || '');
                    }}>Charger la période active</button>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={onSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-slate-700">
                    Date début <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="form-control form-control-lg rounded-3 border-0 shadow-sm" 
                    style={{ background: '#f8f9fa' }}
                    value={dateDebut} 
                    onChange={e => setDateDebut(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-slate-700">Date fin</label>
                  <input 
                    type="date" 
                    className="form-control form-control-lg rounded-3 border-0 shadow-sm" 
                    style={{ background: '#f8f9fa' }}
                    value={dateFin} 
                    onChange={e => setDateFin(e.target.value)} 
                  />
                </div>
              </div>

              <div className="card border-0 rounded-3 mb-3" style={{ background: '#f8f9fa' }}>
                <div className="card-body p-3">
                  <div className="table-responsive">
                    <table className="table table-borderless align-middle mb-0">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th className="fw-semibold" style={{ color: '#4338ca' }}>Propriétaire</th>
                          <th className="fw-semibold" style={{ color: '#4338ca', width: '120px' }}>Numérateur</th>
                          <th className="fw-semibold" style={{ color: '#4338ca', width: '130px' }}>Dénominateur</th>
                          <th className="fw-semibold" style={{ color: '#4338ca', width: '100px' }}>Part (%)</th>
                          <th style={{ width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => {
                          const num = Number(r.part_numerateur || 0);
                          const den = Number(r.part_denominateur || 1);
                          const fraction = den > 0 ? (num / den) : 0;
                          const individualPct = (fraction * 100).toFixed(2);
                          const hasError = num <= 0 || den <= 0 || num > den;
                          
                          return (<tr key={idx}>
                            <td className="py-2">
                              <select 
                                className="form-select rounded-3 border-0 shadow-sm" 
                                style={{ background: '#ffffff', minWidth: 240 }}
                                value={r.proprietaire_id} 
                                onChange={e => updateRow(idx, { proprietaire_id: e.target.value })} 
                                required>
                                <option value="">Choisir un propriétaire…</option>
                                {proprietaires.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.nom_raison || p.email || `#${p.id}`}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2">
                              <input 
                                type="number" 
                                min={1} 
                                step={1}
                                className={`form-control rounded-3 border-0 shadow-sm ${hasError ? 'border border-danger' : ''}`}
                                style={{ background: '#ffffff' }}
                                value={r.part_numerateur}
                                onChange={e => updateRow(idx, { part_numerateur: e.target.value })}
                                required
                              />
                            </td>
                            <td className="py-2">
                              <input 
                                type="number" 
                                min={1} 
                                step={1}
                                className={`form-control rounded-3 border-0 shadow-sm ${hasError ? 'border border-danger' : ''}`}
                                style={{ background: '#ffffff' }}
                                value={r.part_denominateur}
                                onChange={e => updateRow(idx, { part_denominateur: e.target.value })}
                                required
                              />
                            </td>
                            <td className="py-2">
                              <span className={`badge rounded-pill px-2 py-1 ${hasError ? 'bg-danger' : 'bg-info'}`}>
                                {individualPct}%
                              </span>
                            </td>
                            <td className="py-2">
                              <button 
                                type="button" 
                                className="btn btn-sm rounded-3 border-0"
                                style={{ 
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => removeRow(idx)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#fecaca';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fee2e2';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn rounded-3 border-0 shadow-sm mt-3"
                    style={{
                      background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
                      color: '#4338ca',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onClick={addRow}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    Ajouter un propriétaire
                  </button>
                </div>
              </div>

              {/* Total validation */}
              <div className="alert rounded-3 border-0 shadow-sm mb-4" 
                   style={{
                     background: isValidTotal 
                       ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' 
                       : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                     color: isValidTotal ? '#065f46' : '#b91c1c',
                     fontWeight: '500'
                   }}>
                <div className="d-flex align-items-center gap-3">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    {isValidTotal ? (
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    ) : (
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    )}
                  </svg>
                  <div className="flex-grow-1">
                    <div>
                      <strong>Total des parts:</strong> {totalPct}% 
                      {isValidTotal ? (
                        <span className="ms-2">✓ La somme est correcte (100%)</span>
                      ) : (
                        <span className="ms-2">
                          {Math.abs(total - 1) < 0.0001 
                            ? '✓ Somme = 100%, mais il y a des erreurs de validation'
                            : `La somme doit être égale à 100% (actuellement ${totalPct}%)`
                          }
                        </span>
                      )}
                    </div>
                    
                    {/* Affichage des erreurs de validation */}
                    {errors.length > 0 && (
                      <div className="mt-2">
                        <small className="d-block fw-semibold">Erreurs de validation:</small>
                        <ul className="mb-0 mt-1 ps-3">
                          {errors.map((error, idx) => (
                            <li key={idx}><small>{error}</small></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Affichage du détail du calcul */}
                    {rows.length > 0 && (
                      <div className="mt-2">
                        <small className="d-block">
                          <strong>Détail:</strong> {rows.map((r, idx) => {
                            const num = Number(r.part_numerateur || 0);
                            const den = Number(r.part_denominateur || 1);
                            const fraction = den > 0 ? (num / den) : 0;
                            const pct = (fraction * 100).toFixed(2);
                            return `${num}/${den} (${pct}%)`;
                          }).join(' + ')} = {totalPct}%
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Options removed: auto-génération toujours active */}

              {/* Submit button */}
              <div className="d-flex gap-3">
                <button 
                  type="submit"
                  disabled={!isValidTotal || isSaving}
                  className="btn btn-lg text-white fw-semibold shadow d-flex align-items-center gap-2"
                  style={{
                    background: (!isValidTotal || isSaving) 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 32px',
                    transition: 'all 0.3s ease',
                    cursor: (!isValidTotal || isSaving) ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (isValidTotal && !isSaving) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}>
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
                      </svg>
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Modal for generated documents */}
      <GenerationResultModal
        open={showModal}
        items={modalItems}
        onClose={() => {
          setShowModal(false);
          setModalItems([]);
          // Perform the deferred reset if modal was open
          setRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
          setDateDebut('');
          setDateFin('');
          refetch();
        }}
        onGotoMandats={() => navigate('/mandats')}
        onGotoAvenants={() => navigate('/avenants')}
      />
      <ManualDocsWizard
        open={showManualWizard}
        onClose={() => {
          setShowManualWizard(false);
          // After manual wizard closes, reset and refresh
          setRows([{ proprietaire_id: '', part_numerateur: 1, part_denominateur: 1 }]);
          setDateDebut('');
          setDateFin('');
          refetch();
        }}
        proprietaires={proprietaires}
        defaultProprietaireId={rows[0]?.proprietaire_id || ''}
        defaultDateDebut={dateDebut}
        defaultDateFin={dateFin}
        uniteDescription={undefined}
        allowAvenant={true}
        lockCoreFields={true}
      />
    </div>
  );
}

// (Modal moved to a separate component at src/components/GenerationResultModal.jsx)
