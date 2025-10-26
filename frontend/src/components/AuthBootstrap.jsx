import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMeQuery } from '../features/auth/authApi';

export default function AuthBootstrap() {
  const token = useSelector((s) => s.auth?.token) || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  // Trigger /me to rehydrate store when token exists
  useMeQuery(undefined, { skip: !token, refetchOnMountOrArgChange: true });

  // Nothing to render
  return null;
}
