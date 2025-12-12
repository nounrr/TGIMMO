import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import LocatairesShadcn from './pages/LocatairesShadcn';
import ProprietairesShadcn from './pages/ProprietairesShadcn';
import UnitesShadcn from './pages/UnitesShadcn';
import UniteOwners from './pages/UniteOwners';
import MandatsGestionShadcn from './pages/MandatsGestionShadcn';
import CreateMandatShadcn from './pages/CreateMandatShadcn';
import AvenantsMandatShadcn from './pages/AvenantsMandatShadcn';
import MandatEditShadcn from './pages/MandatEditShadcn';
import AvenantEditShadcn from './pages/AvenantEditShadcn';
import BauxShadcn from './pages/BauxShadcn';
import BailCreate from './pages/BailCreate';
import BailEdit from './pages/BailEdit';
import BailRemiseClesShadcn from './pages/BailRemiseClesShadcn';
import RemisesClesShadcn from './pages/RemisesClesShadcn';
import RolesPermissionsShadcn from './pages/RolesPermissionsShadcn';
import EmployesShadcn from './pages/EmployesShadcn';
import PrestataireShadcn from './pages/PrestataireShadcn';
import './App.css';
import AuthBootstrap from './components/AuthBootstrap';
import Devis from './pages/Devis';
import Factures from './pages/Factures';
import ReclamationsShadcn from './pages/ReclamationsShadcn';
import ReclamationCreate from './pages/ReclamationCreate';
import ReclamationTypes from './pages/ReclamationTypes';
import InterventionsShadcn from './pages/InterventionsShadcn';
import InterventionCreate from './pages/InterventionCreate';
import ApprochesProprietairesShadcn from './pages/ApprochesProprietairesShadcn';
import ApprochesLocatairesShadcn from './pages/ApprochesLocatairesShadcn';
import ChargesList from './pages/ChargesList';
import LiquidationList from './pages/LiquidationList';
import TestDebug from './pages/TestDebug';
import GuideShadcn from './pages/GuideShadcn';
import TestUniteMandat from './pages/TestUniteMandat';
import GedShadcn from './pages/GedShadcn';
import PaiementsLocataires from './pages/PaiementsLocataires';


export default function App() {
  return (
    <>
      <AuthBootstrap />
      <Routes>
        {/* Si déjà connecté, rediriger /login vers /dashboard */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        {/* Toutes les routes protégées avec Layout (Sidebar + BottomMenu) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/locataires" element={<LocatairesShadcn />} />
            <Route path="/proprietaires" element={<ProprietairesShadcn />} />
            <Route path="/unites" element={<UnitesShadcn />} />
            <Route path="/unites/:uniteId/owners" element={<UniteOwners />} />
            <Route path="/mandats" element={<MandatsGestionShadcn />} />
            <Route path="/mandats/nouveau" element={<CreateMandatShadcn />} />
            <Route path="/mandats/:id" element={<MandatEditShadcn />} />
            <Route path="/avenants" element={<AvenantsMandatShadcn />} />
            <Route path="/avenants/:id" element={<AvenantEditShadcn />} />
            <Route path="/baux" element={<BauxShadcn />} />
            <Route path="/baux/nouveau" element={<BailCreate />} />
            <Route path="/baux/:id" element={<BailEdit />} />
            <Route path="/baux/:id/remise-cles" element={<BailRemiseClesShadcn />} />
            <Route path="/remises-cles" element={<RemisesClesShadcn />} />
            <Route path="/prestataires" element={<PrestataireShadcn />} />
            <Route path="/reclamations" element={<ReclamationsShadcn />} />
            <Route path="/reclamations/nouveau" element={<ReclamationCreate />} />
            <Route path="/reclamations/:id/edit" element={<ReclamationCreate />} />
            <Route path="/reclamations/types" element={<ReclamationTypes />} />
            <Route path="/interventions" element={<InterventionsShadcn />} />
            <Route path="/interventions/nouveau" element={<InterventionCreate />} />
            <Route path="/interventions/:id/edit" element={<InterventionCreate />} />
            <Route path="/devis" element={<Devis />} />
            <Route path="/factures" element={<Factures />} />
            <Route path="/approches/proprietaires" element={<ApprochesProprietairesShadcn />} />
            <Route path="/approches/locataires" element={<ApprochesLocatairesShadcn />} />
            <Route path="/charges" element={<ChargesList />} />
            <Route path="/liquidations" element={<LiquidationList />} />
            <Route path="/test-debug" element={<TestDebug />} />
            <Route path="/test-debug-top" element={<TestDebug />} />
            <Route path="/test-unite-mandat" element={<TestUniteMandat />} />
            <Route path="/roles-permissions" element={<RolesPermissionsShadcn />} />
            <Route path="/employes" element={<EmployesShadcn />} />
            <Route path="/ged" element={<GedShadcn />} />
            <Route path="/paiements-locataires" element={<PaiementsLocataires />} />
            <Route path="/guide" element={<GuideShadcn />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

