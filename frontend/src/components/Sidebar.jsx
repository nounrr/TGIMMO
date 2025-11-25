import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLogoutMutation, useMeQuery } from '../features/auth/authApi';
import { useSelector } from 'react-redux';
import { useSidebar } from '../contexts/SidebarContext';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const { data: me } = useMeQuery();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { can } = useAuthz();
  const location = useLocation();
  // Ouvrir par défaut Gestion locative; ouvrir Maintenance si route correspond
  const [expandedGroups, setExpandedGroups] = useState({
    'Gestion locative': true,
    'Maintenance': /^(\/prestataires|\/reclamations|\/interventions|\/devis|\/factures)/.test(location.pathname)
  });

  // Resolve current user (same as Profile.jsx)
  const user = me || authUser;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Paths à forcer visibles (debug / contournement permissions)
  const ALWAYS_VISIBLE_PATHS = ['/liquidations', '/test-debug', '/test-debug-top'];

  const navItems = [
    {
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
          <path fillRule="evenodd" d="M0 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0zm8-7a7 7 0 0 0-2.219 13.657 8.932 8.932 0 0 1-.264-5.36c.185-.718.39-1.367.615-1.942.23-.585.478-1.098.733-1.535.253-.436.517-.794.79-1.064.274-.27.562-.427.85-.427.287 0 .576.157.85.427.273.27.537.628.79 1.064.255.437.503.95.733 1.535.225.575.43 1.224.615 1.942a8.932 8.932 0 0 1-.264 5.36A7 7 0 0 0 8 3z"/>
        </svg>
      ),
      label: 'Dashboard'
    },
    {
      path: '/test-debug-top',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        </svg>
      ),
      label: 'Test Debug Top'
    },
    {
      path: '/mandats',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6l4-4V2a2 2 0 0 0-2-2H4z"/>
          <path d="M10 16v-3a1 1 0 0 1 1-1h3"/>
        </svg>
      ),
      label: 'Mandats'
    },
    {
      path: '/avenants',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1h8a1 1 0 0 1 1 1v9.5a.5.5 0 0 1-.146.354l-3.5 3.5A.5.5 0 0 1 9 15H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
          <path d="M9 15v-3a1 1 0 0 1 1-1h3"/>
        </svg>
      ),
      label: 'Avenants'
    },
    {
      path: '/approches/proprietaires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.29.25-.542.523-.76.816A4.998 4.998 0 0 1 8 3c1.761 0 3.314-.906 4.354-1.842A5.53 5.53 0 0 0 8 0Z"/>
          <path d="M13.468 6.37c-.69-.243-1.463-.371-2.218-.412A5.52 5.52 0 0 1 8 7a5.52 5.52 0 0 1-3.25-1.042c-.755.04-1.528.169-2.218.412C1.45 6.614 0 7.393 0 8.5 0 9.607 1.45 10.386 2.314 10.63c.69.243 1.463.371 2.218.412A5.52 5.52 0 0 1 8 10c1.244 0 2.41-.378 3.25-1.042.755-.04 1.528-.169 2.218-.412C14.55 8.386 16 7.607 16 6.5c0-1.107-1.45-1.886-2.532-2.13Z"/>
          <path d="M8 11a5.53 5.53 0 0 0-3.594 1.342c-.29.25-.542.523-.76.816A4.998 4.998 0 0 1 8 14c1.761 0 3.314-.906 4.354-1.842A5.53 5.53 0 0 0 8 11Z"/>
        </svg>
      ),
      label: 'Approches Propriétaires'
    },
    {
      path: '/approches/locataires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
          <path d="M1 5a4 4 0 1 1 8 0v2H7.5A1.5 1.5 0 0 0 6 8.5V9H4V7.5A1.5 1.5 0 0 0 2.5 6H1V5Z"/>
        </svg>
      ),
      label: 'Approches Locataires'
    },
    // Regroupement gestion locative
    {
      type: 'group',
      label: 'Gestion locative',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.29.25-.542.523-.76.816A4.998 4.998 0 0 1 8 3c1.761 0 3.314-.906 4.354-1.842A5.53 5.53 0 0 0 8 0Z"/>
          <path d="M13.468 6.37c-.69-.243-1.463-.371-2.218-.412A5.52 5.52 0 0 1 8 7a5.52 5.52 0 0 1-3.25-1.042c-.755.04-1.528.169-2.218.412C1.45 6.614 0 7.393 0 8.5 0 9.607 1.45 10.386 2.314 10.63c.69.243 1.463.371 2.218.412A5.52 5.52 0 0 1 8 10c1.244 0 2.41-.378 3.25-1.042.755-.04 1.528-.169 2.218-.412C14.55 8.386 16 7.607 16 6.5c0-1.107-1.45-1.886-2.532-2.13Z"/>
          <path d="M8 11a5.53 5.53 0 0 0-3.594 1.342c-.29.25-.542.523-.76.816A4.998 4.998 0 0 1 8 14c1.761 0 3.314-.906 4.354-1.842A5.53 5.53 0 0 0 8 11Z"/>
        </svg>
      ),
      children: [
        {
          path: '/baux',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.5 1.866a1 1 0 0 0-1 0l-6 3.464A1 1 0 0 0 1 6.196v6.608a1 1 0 0 0 .5.866l6 3.464a1 1 0 0 0 1 0l6-3.464a1 1 0 0 0 .5-.866V6.196a1 1 0 0 0-.5-.866l-6-3.464z"/>
              <path d="M8.5 4.134 13.5 7 8.5 9.866 3.5 7l5-2.866z" />
            </svg>
          ),
          label: 'Baux'
        },
        {
          path: '/remises-cles',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 11a5 5 0 1 1 9.584 1.99.5.5 0 0 0 .342.622l.326.094a1.5 1.5 0 0 1 1.044 1.423V16a.5.5 0 0 1-.5.5H11v-.5A1.5 1.5 0 0 0 9.5 14h-1A1.5 1.5 0 0 0 7 15.5v.5H1.5a.5.5 0 0 1-.5-.5v-2.17A1.5 1.5 0 0 1 2.044 11.9l.326-.094a.5.5 0 0 0 .342-.622A5.002 5.002 0 0 1 3 11Z"/>
              <path d="M8 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
            </svg>
          ),
          label: 'Remises clés'
        },
        {
          path: '/charges',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
            </svg>
          ),
          label: 'Charges'
        },
        {
          path: '/liquidations',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
            </svg>
          ),
          label: 'Liquidations'
        },
        {
          path: '/test-debug',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            </svg>
          ),
          label: 'Test Debug'
        }
      ]
    },
    {
      type: 'group',
      label: 'Maintenance',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.5 1a1 1 0 0 0-1 1v1H3.5A1.5 1.5 0 0 0 2 4.5v2A1.5 1.5 0 0 0 3.5 8H5v1H3.5A1.5 1.5 0 0 0 2 10.5v2A1.5 1.5 0 0 0 3.5 14H5v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h1.5A1.5 1.5 0 0 0 13 12.5v-2A1.5 1.5 0 0 0 11.5 9H10V8h1.5A1.5 1.5 0 0 0 13 6.5v-2A1.5 1.5 0 0 0 11.5 3H10V2a1 1 0 0 0-1-1h-2Z"/>
          <path d="M6 8V5h4v3H6Zm0 1h4v3H6V9Z"/>
        </svg>
      ),
      children: [
        {
          path: '/prestataires',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            </svg>
          ),
          label: 'Prestataires'
        },
        {
          path: '/reclamations',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a7 7 0 0 0-6.468 9.89c.146.305.393.558.696.68l2.665 1.066A1 1 0 0 0 6 11.714V10.5a.5.5 0 0 1 .5-.5h1c.827 0 1.5-.673 1.5-1.5V7a.5.5 0 0 1 .5-.5h1A1.5 1.5 0 0 0 13 5V4a3 3 0 0 0-3-3H8Z"/>
              <path d="M2.908 12.317A7 7 0 0 0 14.98 9.39 7 7 0 0 1 8 15v1.5a.5.5 0 0 1-.854.354l-4-4a.5.5 0 0 1 .262-.837l.5-.2Z"/>
            </svg>
          ),
          label: 'Réclamations'
        },
        {
          path: '/reclamations/types',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
          ),
          label: 'Types de réclamations'
        },
        {
          path: '/interventions',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.5 1a1 1 0 0 0-1 1v1H3.5A1.5 1.5 0 0 0 2 4.5v2A1.5 1.5 0 0 0 3.5 8H5v1H3.5A1.5 1.5 0 0 0 2 10.5v2A1.5 1.5 0 0 0 3.5 14H5v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h1.5A1.5 1.5 0 0 0 13 12.5v-2A1.5 1.5 0 0 0 11.5 9H10V8h1.5A1.5 1.5 0 0 0 13 6.5v-2A1.5 1.5 0 0 0 11.5 3H10V2a1 1 0 0 0-1-1h-2Z"/>
              <path d="M6 8V5h4v3H6Zm0 1h4v3H6V9Z"/>
            </svg>
          ),
          label: 'Interventions'
        },
        {
          path: '/devis',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 0a2 2 0 0 0-2 2v11.293A1 1 0 0 0 2.293 14l2.853 2.853A1 1 0 0 0 6 17.293V16h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
              <path d="M8.5 4.5a.5.5 0 0 1 .5.5v.5H10a.5.5 0 0 1 0 1H9v.5a.5.5 0 0 1-1 0V6H7a.5.5 0 0 1 0-1h1V5a.5.5 0 0 1 .5-.5z"/>
              <path d="M5 10.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
            </svg>
          ),
          label: 'Devis'
        },
        {
          path: '/factures',
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 1a1 1 0 0 0-1 1v12.5a.5.5 0 0 0 .757.429L4 13.071l2.243 1.858a.5.5 0 0 0 .614 0L9.1 13.428l2.286 1.858A.5.5 0 0 0 12 14.5V2a1 1 0 0 0-1-1H2z"/>
              <path d="M3 3h8v2H3V3zm0 3h8v2H3V6zm0 3h5v2H3V9z"/>
            </svg>
          ),
          label: 'Factures'
        }
      ]
    },
    {
      path: '/employes',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      label: 'Employés'
    },
    {
      path: '/locataires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      label: 'Locataires'
    },
    {
      path: '/proprietaires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      label: 'Propriétaires'
    },
    {
      path: '/unites',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
          <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
        </svg>
      ),
      label: 'Unités'
    },
    {
      path: '/roles-permissions',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.5 9.5a3.5 3.5 0 1 1 4.243 3.41l-.243.09V14a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1v-1a3.5 3.5 0 0 1-1-3.5zm3.5-2.5a2.5 2.5 0 0 0-2.45 2H6a2 2 0 1 0 0 4h.55c.212.58.59 1.08 1.086 1.44L7.5 15h2l-.136-.56A2.5 2.5 0 0 0 9 11.5 2.5 2.5 0 0 0 9 7z"/>
          <path d="M11.5 1a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-1 0V4h-1.5a.5.5 0 0 1 0-1H11V1.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      label: 'Rôles & Permissions'
    }
  ];

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user) return '??';
    const name = (user.name || '').trim();
    if (name) {
      const parts = name.split(/\s+/);
      const first = parts[0]?.charAt(0) || '';
      const last = parts[1]?.charAt(0) || '';
      return `${first}${last}`.toUpperCase() || (user.email?.slice(0, 2)?.toUpperCase()) || 'US';
    }
    return (user.email?.slice(0, 2)?.toUpperCase()) || 'US';
  };

  // Obtenir le nom complet
  const getFullName = () => {
    if (!user) return 'Utilisateur';
    return (user.name || '').trim() || user.email || 'Utilisateur';
  };

  // Obtenir le rôle (supporte tableaux de chaînes ou d'objets)
  const getUserRole = () => {
    const roles = user?.roles;
    if (!Array.isArray(roles) || roles.length === 0) return 'Utilisateur';
    const first = roles[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.name) return first.name;
    return 'Utilisateur';
  };

  const filterNavItems = (items) => {
    const result = items.reduce((acc, item) => {
      if (item.type === 'group') {
        const filteredChildren = item.children.filter(child => {
          // Toujours garder les paths forcés
          if (ALWAYS_VISIBLE_PATHS.includes(child.path)) return true;
          switch (child.path) {
            case '/baux':
              return can(PERMS.baux.view);
            case '/remises-cles':
              return can(PERMS.remises_cles.view);
            case '/charges':
              return can(PERMS.charges.view);
            case '/prestataires':
              return can(PERMS.prestataires.view);
            case '/reclamations':
            case '/reclamations/types':
              return can(PERMS.reclamations.view);
            case '/interventions':
              return can(PERMS.interventions.view);
            case '/devis':
              return can(PERMS.devis.view);
            case '/factures':
              return can(PERMS.factures.view);
            default:
              return true;
          }
        });
        // Conserver le groupe s'il contient au moins un enfant OU si un des ALWAYS_VISIBLE appartient au groupe original
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
        return acc;
      }
      // Top-level items
      const allowed = (() => {
        // Forcer visibilité si dans ALWAYS_VISIBLE_PATHS
        if (ALWAYS_VISIBLE_PATHS.includes(item.path)) return true;
        switch (item.path) {
          case '/locataires':
            return can(PERMS.locataires.view);
          case '/proprietaires':
            return can(PERMS.proprietaires.view);
          case '/unites':
            return can(PERMS.unites.view);
          case '/roles-permissions':
            return can(PERMS.roles.view);
          case '/employes':
            return can(PERMS.users.view);
          case '/mandats':
            return can(PERMS.mandats.view);
          case '/avenants':
            return can(PERMS.avenants.view);
          case '/approches/proprietaires':
            return can(PERMS.approches_proprietaires.view);
          case '/approches/locataires':
            return can(PERMS.approches_locataires.view);
          default:
            return true;
        }
      })();
      if (allowed) acc.push(item);
      return acc;
    }, []);

    // Fallback: injecter top-level si jamais pas présent (sécurité supplémentaire)
    const ensurePath = (path, label) => {
      const exists = result.some(i => i.path === path || (i.type === 'group' && i.children?.some(c => c.path === path)));
      if (!exists) {
        result.push({
          path,
          icon: (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            </svg>
          ),
          label
        });
      }
    };

    ensurePath('/liquidations', 'Liquidations');
    ensurePath('/test-debug', 'Test Debug');

    return result;
  };

  // Debug: log permissions once
  useEffect(() => {
    if (user) {
      console.log('[DEBUG] User permissions:', user.permissions || user.all_permissions || []);
      console.log('[DEBUG] liquidations.view allowed?', can(PERMS.liquidations.view));
    }
  }, [user, can]);

  const allowedNavItems = filterNavItems(navItems);

  // Debug logs
  console.log('[DEBUG] allowedNavItems:', allowedNavItems);
  console.log('[DEBUG] expandedGroups:', expandedGroups);
  console.log('[DEBUG] isCollapsed:', isCollapsed);

  return (
    <aside className="d-none d-lg-flex flex-column position-fixed top-0 start-0 vh-100 shadow-lg"
           style={{
             width: isCollapsed ? '80px' : '280px',
             background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
             borderRight: '1px solid rgba(0,0,0,0.05)',
             zIndex: 1000,
             transition: 'width 0.3s ease'
           }}>
      {/* Logo & Toggle Button */}
      <div className="p-4 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        {!isCollapsed && (
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                 style={{
                   width: '48px',
                   height: '48px',
                   backgroundColor: '#001f3f',
                   background: '#001f3f'
                 }}>
              <img src="/logo.png" alt="TGI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="h5 fw-bold mb-0" style={{
                color: '#001f3f'
              }}>TGI</h1>
              <p className="small text-muted mb-0">Gestion Immobilière</p>
            </div>
          </div>
        )}
        {isCollapsed && (
           <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3"
           style={{
             width: '48px',
             height: '48px',
             backgroundColor: '#001f3f',
             background: '#001f3f'
           }}>
            <img src="/logo.png" alt="TGI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn btn-sm rounded-circle p-2 border-0"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            transition: 'all 0.3s ease',
            marginLeft: isCollapsed ? 'auto' : '0',
            marginRight: isCollapsed ? 'auto' : '0'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            <path fillRule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
          </svg>
        </button>
      </div>

      {/* User Profile Section */}
      <NavLink 
        to="/profile"
        className="text-decoration-none"
      >
        <div className="p-3 border-bottom" style={{ 
          borderColor: 'rgba(0,0,0,0.05)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}>
          <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'gap-3'}`}>
            {/* Avatar */}
            <div className="position-relative flex-shrink-0">
              {user?.photo_url ? (
                <img 
                  src={user.photo_url} 
                  alt={getFullName()}
                  className="rounded-circle border-2"
                  style={{
                    width: isCollapsed ? '40px' : '56px',
                    height: isCollapsed ? '40px' : '56px',
                    objectFit: 'cover',
                    borderColor: '#e5e7eb !important',
                    transition: 'all 0.3s ease'
                  }}
                />
              ) : (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white border-2"
                  style={{
                    width: isCollapsed ? '40px' : '56px',
                    height: isCollapsed ? '40px' : '56px',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    borderColor: '#e5e7eb !important',
                    fontSize: isCollapsed ? '0.9rem' : '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {getUserInitials()}
                </div>
              )}
              {/* Online indicator */}
              <div 
                className="position-absolute rounded-circle border-2 border-white"
                style={{
                  width: '12px',
                  height: '12px',
                  background: '#10b981',
                  bottom: '0',
                  right: '0'
                }}
              />
            </div>
            
            {/* User Info */}
            {!isCollapsed && (
              <div className="flex-grow-1 overflow-hidden">
                <p className="mb-0 fw-semibold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                  {getFullName()}
                </p>
                <p className="mb-0 text-muted text-truncate" style={{ fontSize: '0.8rem' }}>
                  {getUserRole()}
                </p>
              </div>
            )}
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-grow-1 p-3 overflow-auto">
        <div className="d-flex flex-column gap-1">
          {allowedNavItems.map((item, idx) => {
            if (item.type === 'group') {
              const isExpanded = expandedGroups[item.label];
              return (
                <div key={`group-${idx}`}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-100 d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} px-3 py-3 rounded-3 text-decoration-none border-0 bg-transparent text-dark`}
                    style={{
                      transition: 'all 0.3s ease',
                      fontWeight: '600',
                      background: isExpanded ? 'rgba(37, 99, 235, 0.08)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'gap-3'}`}>
                      {item.icon}
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <svg 
                        width="16" 
                        height="16" 
                        fill="currentColor" 
                        viewBox="0 0 16 16"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    )}
                  </button>
                  
                  {/* Group Children */}
                  {isExpanded && !isCollapsed && (
                    <div className="ms-3 mt-1 d-flex flex-column gap-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) => 
                            `d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                              isActive 
                                ? 'text-white shadow-sm' 
                                : 'text-dark hover-item'
                            }`
                          }
                          style={({ isActive }) => ({
                            background: isActive 
                              ? 'linear-gradient(135deg, #2563eb, #4f46e5)' 
                              : 'transparent',
                            transition: 'all 0.3s ease',
                            fontWeight: isActive ? '600' : '500',
                            fontSize: '0.9rem'
                          })}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.classList.contains('text-white')) {
                              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.currentTarget.classList.contains('text-white')) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }
                          }}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular menu item
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'gap-3'} px-3 py-3 rounded-3 text-decoration-none transition-all ${
                    isActive 
                      ? 'text-white shadow-sm' 
                      : 'text-dark hover-item'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive 
                    ? 'linear-gradient(135deg, #2563eb, #4f46e5)' 
                    : 'transparent',
                  transition: 'all 0.3s ease',
                  fontWeight: isActive ? '600' : '500'
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('text-white')) {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                    e.currentTarget.style.transform = isCollapsed ? 'scale(1.05)' : 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('text-white')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0) scale(1)';
                  }
                }}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Logout button */}
      <div className="p-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`btn w-100 d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-center gap-2'} py-3 rounded-3 text-danger border-0`}
          style={{
            background: 'rgba(220, 38, 38, 0.08)',
            transition: 'all 0.3s ease',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              {!isCollapsed && <span>Déconnexion...</span>}
            </>
          ) : (
            <>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
              </svg>
              {!isCollapsed && <span>Déconnexion</span>}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
