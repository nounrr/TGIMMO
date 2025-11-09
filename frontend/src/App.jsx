import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Locataires from './pages/Locataires';
import Proprietaires from './pages/Proprietaires';
import Unites from './pages/Unites';
import UniteOwners from './pages/UniteOwners';
import MandatsGestion from './pages/MandatsGestion';
import AvenantsMandat from './pages/AvenantsMandat';
import MandatEdit from './pages/MandatEdit';
import AvenantEdit from './pages/AvenantEdit';
import Baux from './pages/Baux';
import BailCreate from './pages/BailCreate';
import BailEdit from './pages/BailEdit';
import BailRemiseCles from './pages/BailRemiseCles';
import RemisesCles from './pages/RemisesCles';
import RolesPermissions from './pages/RolesPermissions';
import Employes from './pages/Employes';
import Prestataires from './pages/Prestataires';
import './App.css';
import AuthBootstrap from './components/AuthBootstrap';



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
          <Route path="/locataires" element={<Locataires />} />
          <Route path="/proprietaires" element={<Proprietaires />} />
          <Route path="/unites" element={<Unites />} />
          <Route path="/unites/:uniteId/owners" element={<UniteOwners />} />
          <Route path="/mandats" element={<MandatsGestion />} />
          <Route path="/mandats/:id" element={<MandatEdit />} />
          <Route path="/avenants" element={<AvenantsMandat />} />
          <Route path="/avenants/:id" element={<AvenantEdit />} />
          <Route path="/baux" element={<Baux />} />
          <Route path="/baux/nouveau" element={<BailCreate />} />
          <Route path="/baux/:id" element={<BailEdit />} />
            <Route path="/baux/:id/remise-cles" element={<BailRemiseCles />} />
            <Route path="/remises-cles" element={<RemisesCles />} />
          <Route path="/prestataires" element={<Prestataires />} />
          <Route path="/roles-permissions" element={<RolesPermissions />} />
          <Route path="/employes" element={<Employes />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Route>
      </Routes>
    </>
  );
}

