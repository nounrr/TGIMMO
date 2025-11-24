import { useLogoutMutation } from '../features/auth/authApi';
import { useNavigate, Link } from 'react-router-dom';
import {
  useGetBauxQuery,
  useGetInterventionsQuery,
  useGetReclamationsQuery,
  useGetDevisQuery,
  useGetFacturesQuery,
} from '../api/baseApi';
import { useMemo, useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Fetch data
  const { data: bauxResp, isLoading: bauxLoading } = useGetBauxQuery({ per_page: 1000 });
  const { data: interventionsResp, isLoading: interventionsLoading } = useGetInterventionsQuery({ per_page: 1000 });
  const { data: reclamationsResp, isLoading: reclamationsLoading } = useGetReclamationsQuery({ per_page: 1000 });
  const { data: devisResp, isLoading: devisLoading } = useGetDevisQuery({ per_page: 1000 });
  const { data: facturesResp, isLoading: facturesLoading } = useGetFacturesQuery({ per_page: 1000 });

  // Helpers
  const extractList = (resp) => resp?.data || resp || [];
  const groupBy = (arr, key) => arr.reduce((acc, item) => {
    const k = item[key] || 'inconnu';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const sumField = (arr, field) => arr.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);

  const baux = extractList(bauxResp);
  const interventions = extractList(interventionsResp);
  const reclamations = extractList(reclamationsResp);
  const devis = extractList(devisResp);
  const factures = extractList(facturesResp);

  const bailStatusCounts = useMemo(() => groupBy(baux, 'statut'), [baux]);
  const interventionStatusCounts = useMemo(() => groupBy(interventions, 'status'), [interventions]);
  const reclamationStatusCounts = useMemo(() => groupBy(reclamations, 'status'), [reclamations]);
  const interventionUrgenceCounts = useMemo(() => groupBy(interventions, 'urgence'), [interventions]);

  const devisTotals = useMemo(() => ({
    totalTTC: sumField(devis, 'total_ttc'),
    totalHT: sumField(devis, 'montant_ht'),
  }), [devis]);
  const facturesTotals = useMemo(() => ({
    totalTTC: sumField(factures, 'total_ttc'),
    totalHT: sumField(factures, 'montant_ht'),
    payees: factures.filter(f => !!f.paid_at).length,
    impayees: factures.filter(f => !f.paid_at).length,
  }), [factures]);

  const interventionsCharge = useMemo(() => sumField(interventions, 'charge'), [interventions]);

  const loading = bauxLoading || interventionsLoading || reclamationsLoading || devisLoading || facturesLoading;

  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {}
    navigate('/login', { replace: true });
  };

  // Statistiques des 7 derniers jours
  // Use cloned arrays before sorting to avoid mutating (RTK Query data may be frozen)
  const recentInterventions = useMemo(() => {
    if (!Array.isArray(interventions)) return [];
    return [...interventions]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  }, [interventions]);

  const recentReclamations = useMemo(() => {
    if (!Array.isArray(reclamations)) return [];
    return [...reclamations]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  }, [reclamations]);

  // Chart component simple avec SVG
  const SimpleBarChart = ({ data, colors, height = 200 }) => {
    const maxValue = Math.max(...Object.values(data), 1);
    const entries = Object.entries(data);
    
    return (
      <div className="position-relative" style={{ height: `${height}px` }}>
        <div className="d-flex align-items-end justify-content-around h-100 gap-2">
          {entries.map(([key, value]) => {
            const barHeight = (value / maxValue) * 100;
            return (
              <div key={key} className="d-flex flex-column align-items-center flex-fill" style={{ maxWidth: '80px' }}>
                <div className="mb-2 small fw-semibold" style={{ color: colors[key] || '#6c757d' }}>
                  {value}
                </div>
                <div 
                  className="w-100 rounded-top position-relative"
                  style={{
                    height: `${barHeight}%`,
                    background: `linear-gradient(180deg, ${colors[key]}dd 0%, ${colors[key]} 100%)`,
                    minHeight: value > 0 ? '20px' : '0px',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 -2px 8px ${colors[key]}40`
                  }}
                />
                <div className="mt-2 small text-muted text-center text-capitalize" style={{ fontSize: '0.7rem' }}>
                  {key.replace('_', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Donut chart simple
  const DonutChart = ({ data, colors, size = 180 }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    const entries = Object.entries(data);
    let currentAngle = -90;
    const radius = size / 2;
    const strokeWidth = 35;
    const center = radius;
    
    const createArc = (startAngle, endAngle) => {
      const start = polarToCartesian(center, center, radius - strokeWidth / 2, endAngle);
      const end = polarToCartesian(center, center, radius - strokeWidth / 2, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return `M ${start.x} ${start.y} A ${radius - strokeWidth / 2} ${radius - strokeWidth / 2} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };
    
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    return (
      <div className="d-flex align-items-center justify-content-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
          />
          {entries.map(([key, value], idx) => {
            const angle = (value / total) * 360;
            const path = createArc(currentAngle, currentAngle + angle);
            const result = (
              <path
                key={key}
                d={path}
                fill="none"
                stroke={colors[key] || '#6c757d'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            );
            currentAngle += angle;
            return result;
          })}
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fw-bold"
            style={{ fontSize: '2rem', fill: '#333' }}
          >
            {total}
          </text>
        </svg>
      </div>
    );
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend, loading }) => (
    <div className="card border-0 h-100" style={{ overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '12px', background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
      <div className="card-body p-2 px-3">
        <div className="d-flex align-items-center gap-3">
          <div className={`rounded-3 p-2`} style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
            <i className={`bi ${icon} fs-3 text-white`}></i>
          </div>
          <div className="flex-grow-1">
            <p className="text-white text-opacity-75 small mb-1 text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.5px', fontWeight: 600 }}>
              {title}
            </p>
            <h3 className="mb-0 fw-bold text-white" style={{ fontSize: '1.5rem' }}>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-white" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              ) : value}
            </h3>
            {subtitle && <p className="text-white text-opacity-75 small mb-0 mt-1" style={{ fontSize: '0.7rem' }}>{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <span className={`badge bg-white bg-opacity-25 text-white`}>
              <i className={`bi ${trend.positive ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
              {trend.value}
            </span>
            <span className="text-white text-opacity-75 small">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );

  const ProgressBar = ({ data, colors }) => {
    const entries = Object.entries(data);
    const total = entries.reduce((a, [,v]) => a + v, 0) || 1;
    
    return (
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="flex-grow-1">
          <div className="progress" style={{ height: '8px', borderRadius: '10px' }}>
            {entries.map(([key, value], idx) => (
              <div
                key={key}
                className="progress-bar"
                style={{
                  width: `${(value / total) * 100}%`,
                  backgroundColor: colors[key] || '#6c757d',
                }}
                title={`${key}: ${value}`}
              ></div>
            ))}
          </div>
        </div>
        <div className="text-muted small" style={{ minWidth: '60px', textAlign: 'right' }}>
          {total} total
        </div>
      </div>
    );
  };

  const statusColors = {
    actif: '#10b981',
    en_attente: '#f59e0b',
    resilie: '#ef4444',
    ouvert: '#ef4444',
    planifie: '#3b82f6',
    en_cours: '#f59e0b',
    resolu: '#10b981',
    ferme: '#6b7280',
    annule: '#9ca3af',
    urgent: '#dc2626',
    normal: '#3b82f6',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white shadow-sm" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" 
                   style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}>
                <i className="bi bi-house-door-fill text-white fs-4"></i>
              </div>
              <div>
                <h1 className="mb-0 fw-bold" style={{ fontSize: '1.75rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  TGI Dashboard
                </h1>
                <p className="text-muted small mb-0">
                  <i className="bi bi-calendar3 me-1"></i>
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn btn-outline-danger d-flex align-items-center gap-2 px-4"
              style={{ borderRadius: '10px' }}
            >
              {isLoggingOut ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <i className="bi bi-box-arrow-right"></i>
              )}
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-5 px-4" style={{ maxWidth: '1600px' }}>
        
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="fw-bold mb-1">Tableau de bord</h2>
                <p className="text-muted mb-0">Vue d'ensemble de votre activité immobilière</p>
              </div>
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm ${selectedPeriod === '7days' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedPeriod('7days')}
                >
                  7 jours
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${selectedPeriod === '30days' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedPeriod('30days')}
                >
                  30 jours
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${selectedPeriod === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedPeriod('all')}
                >
                  Tout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-6 col-xl-3">
            <StatCard
              title="Baux actifs"
              value={baux.length}
              subtitle={`${bailStatusCounts.actif || 0} actifs, ${bailStatusCounts.resilie || 0} résiliés`}
              icon="bi-file-earmark-text"
              color="#667eea"
              loading={loading}
            />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard
              title="Interventions"
              value={interventions.length}
              subtitle={`${interventionStatusCounts.ouvert || 0} ouvertes, ${interventionUrgenceCounts.urgent || 0} urgentes`}
              icon="bi-tools"
              color="#f59e0b"
              loading={loading}
            />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard
              title="Réclamations"
              value={reclamations.length}
              subtitle={`${reclamationStatusCounts.ouvert || 0} en attente de traitement`}
              icon="bi-exclamation-triangle"
              color="#ef4444"
              loading={loading}
            />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard
              title="Chiffre d'affaires"
              value={`${facturesTotals.totalTTC.toLocaleString('fr-FR')} €`}
              subtitle={`${facturesTotals.payees} payées / ${factures.length} total`}
              icon="bi-currency-euro"
              color="#10b981"
              loading={loading}
            />
          </div>
        </div>

        {/* Charts & Analytics */}
        <div className="row g-4 mb-5">
          {/* Baux Status - avec Donut Chart */}
          <div className="col-lg-4">
            <div className="card border-0 h-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-pie-chart-fill" style={{ color: '#667eea' }}></i>
                  État des baux
                </h5>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="mb-4">
                  <DonutChart data={bailStatusCounts} colors={statusColors} />
                </div>
                <div className="row g-2">
                  {Object.entries(bailStatusCounts).map(([status, count]) => (
                    <div key={status} className="col-12">
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle" style={{ width: '12px', height: '12px', background: statusColors[status] || '#6c757d' }}></div>
                          <div className="small text-capitalize fw-medium">{status.replace('_', ' ')}</div>
                        </div>
                        <div className="fw-bold" style={{ color: statusColors[status] }}>{count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interventions Status - avec Bar Chart */}
          <div className="col-lg-4">
            <div className="card border-0 h-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-bar-chart-fill" style={{ color: '#f59e0b' }}></i>
                  Interventions par statut
                </h5>
              </div>
              <div className="card-body px-4 pb-4">
                <SimpleBarChart data={interventionStatusCounts} colors={statusColors} height={220} />
                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Coût total</span>
                    <span className="fw-bold fs-5" style={{ color: '#667eea' }}>{interventionsCharge.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Moyenne par intervention</span>
                    <span className="fw-semibold">{interventions.length > 0 ? (interventionsCharge / interventions.length).toFixed(2) : 0} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Réclamations - avec Bar Chart */}
          <div className="col-lg-4">
            <div className="card border-0 h-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-bar-chart-line-fill" style={{ color: '#ef4444' }}></i>
                  Réclamations par statut
                </h5>
              </div>
              <div className="card-body px-4 pb-4">
                <SimpleBarChart data={reclamationStatusCounts} colors={statusColors} height={220} />
                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Taux de résolution</span>
                    <span className="fw-bold fs-5" style={{ color: '#10b981' }}>
                      {reclamations.length > 0 ? ((reclamationStatusCounts.resolu || 0) / reclamations.length * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${reclamations.length > 0 ? ((reclamationStatusCounts.resolu || 0) / reclamations.length * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview Row */}
        <div className="row g-4 mb-5">
          <div className="col-lg-6">
            <div className="card border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-cash-stack" style={{ color: '#10b981' }}></i>
                  Aperçu financier
                </h5>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', border: '1px solid #667eea30' }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rounded-circle p-2" style={{ background: '#667eea20' }}>
                          <i className="bi bi-file-earmark-text text-primary"></i>
                        </div>
                        <span className="small text-muted">Devis</span>
                      </div>
                      <div className="fw-bold fs-3 mb-1" style={{ color: '#667eea' }}>
                        {devisTotals.totalTTC.toLocaleString('fr-FR')} €
                      </div>
                      <div className="small text-muted">
                        HT: {devisTotals.totalHT.toLocaleString('fr-FR')} € • {devis.length} devis
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #10b98115 0%, #10b98115 100%)', border: '1px solid #10b98130' }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                          <i className="bi bi-receipt text-success"></i>
                        </div>
                        <span className="small text-muted">Factures</span>
                      </div>
                      <div className="fw-bold fs-3 mb-1" style={{ color: '#10b981' }}>
                        {facturesTotals.totalTTC.toLocaleString('fr-FR')} €
                      </div>
                      <div className="small text-muted">
                        HT: {facturesTotals.totalHT.toLocaleString('fr-FR')} € • {factures.length} factures
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex gap-3 mt-2">
                      <div className="flex-fill p-3 rounded-3 text-center" style={{ background: '#d1fae5', border: '1px solid #10b981' }}>
                        <div className="fw-bold text-success fs-4">{facturesTotals.payees}</div>
                        <div className="small text-muted mt-1">Payées</div>
                      </div>
                      <div className="flex-fill p-3 rounded-3 text-center" style={{ background: '#fee2e2', border: '1px solid #ef4444' }}>
                        <div className="fw-bold text-danger fs-4">{facturesTotals.impayees}</div>
                        <div className="small text-muted mt-1">Impayées</div>
                      </div>
                      <div className="flex-fill p-3 rounded-3 text-center" style={{ background: '#e0e7ff', border: '1px solid #667eea' }}>
                        <div className="fw-bold fs-4" style={{ color: '#667eea' }}>
                          {factures.length > 0 ? ((facturesTotals.payees / factures.length) * 100).toFixed(0) : 0}%
                        </div>
                        <div className="small text-muted mt-1">Taux paiement</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-lg-6">
            <div className="card border-0 h-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-lightning-charge-fill" style={{ color: '#f59e0b' }}></i>
                  Activité urgente
                </h5>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="p-4 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #ef444415 0%, #dc262615 100%)', border: '2px solid #ef4444' }}>
                      <i className="bi bi-exclamation-triangle-fill fs-1 mb-2" style={{ color: '#ef4444' }}></i>
                      <div className="fw-bold fs-2" style={{ color: '#ef4444' }}>{interventionUrgenceCounts.urgent || 0}</div>
                      <div className="small text-muted mt-1">Interventions urgentes</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-4 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #f59e0b15 0%, #f59e0b15 100%)', border: '2px solid #f59e0b' }}>
                      <i className="bi bi-hourglass-split fs-1 mb-2" style={{ color: '#f59e0b' }}></i>
                      <div className="fw-bold fs-2" style={{ color: '#f59e0b' }}>{interventionStatusCounts.en_cours || 0}</div>
                      <div className="small text-muted mt-1">En cours</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-4 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #3b82f615 0%, #3b82f615 100%)', border: '2px solid #3b82f6' }}>
                      <i className="bi bi-calendar-check fs-1 mb-2" style={{ color: '#3b82f6' }}></i>
                      <div className="fw-bold fs-2" style={{ color: '#3b82f6' }}>{interventionStatusCounts.planifie || 0}</div>
                      <div className="small text-muted mt-1">Planifiées</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-4 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #10b98115 0%, #10b98115 100%)', border: '2px solid #10b981' }}>
                      <i className="bi bi-check-circle-fill fs-1 mb-2" style={{ color: '#10b981' }}></i>
                      <div className="fw-bold fs-2" style={{ color: '#10b981' }}>{interventionStatusCounts.resolu || 0}</div>
                      <div className="small text-muted mt-1">Résolues</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Tables */}
        <div className="row g-4">
          {/* Recent Interventions */}
          <div className="col-lg-6">
            <div className="card border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history" style={{ color: '#f59e0b' }}></i>
                  Interventions récentes
                </h5>
                <Link to="/interventions" className="btn btn-sm btn-outline-primary">
                  Voir tout <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 text-muted small fw-semibold px-4 py-3">Nature</th>
                        <th className="border-0 text-muted small fw-semibold py-3">Statut</th>
                        <th className="border-0 text-muted small fw-semibold py-3">Urgence</th>
                        <th className="border-0 text-muted small fw-semibold py-3 text-end">Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="text-center py-5 text-muted">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Chargement...
                        </td></tr>
                      ) : recentInterventions.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-5 text-muted">Aucune intervention</td></tr>
                      ) : recentInterventions.map(i => (
                        <tr key={i.id}>
                          <td className="px-4 py-3">
                            <div className="fw-medium">{i.nature_probleme || '—'}</div>
                            <div className="small text-muted">{i.localisation || ''}</div>
                          </td>
                          <td className="py-3">
                            <span className="badge rounded-pill" style={{ background: `${statusColors[i.status]}20`, color: statusColors[i.status] }}>
                              {i.status || '—'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${i.urgence === 'urgent' ? 'bg-danger' : i.urgence === 'normal' ? 'bg-primary' : 'bg-secondary'}`}>
                              {i.urgence === 'urgent' ? '🚨' : i.urgence === 'normal' ? 'ℹ️' : '📅'} {i.urgence}
                            </span>
                          </td>
                          <td className="py-3 text-end">
                            {i.charge ? (
                              <span className="fw-semibold">{parseFloat(i.charge).toFixed(2)} €</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reclamations */}
          <div className="col-lg-6">
            <div className="card border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '16px', background: 'white' }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-megaphone" style={{ color: '#ef4444' }}></i>
                  Réclamations récentes
                </h5>
                <Link to="/reclamations" className="btn btn-sm btn-outline-primary">
                  Voir tout <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 text-muted small fw-semibold px-4 py-3">Type</th>
                        <th className="border-0 text-muted small fw-semibold py-3">Source</th>
                        <th className="border-0 text-muted small fw-semibold py-3">Statut</th>
                        <th className="border-0 text-muted small fw-semibold py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="text-center py-5 text-muted">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Chargement...
                        </td></tr>
                      ) : recentReclamations.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-5 text-muted">Aucune réclamation</td></tr>
                      ) : recentReclamations.map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-3">
                            <div className="fw-medium">{r.type?.name || '—'}</div>
                          </td>
                          <td className="py-3">
                            <span className="text-muted small">{r.source || '—'}</span>
                          </td>
                          <td className="py-3">
                            <span className="badge rounded-pill" style={{ background: `${statusColors[r.status]}20`, color: statusColors[r.status] }}>
                              {r.status || '—'}
                            </span>
                          </td>
                          <td className="py-3 text-muted small">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
