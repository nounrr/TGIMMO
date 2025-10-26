    import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof localStorage !== 'undefined' && localStorage.getItem('user')
    ? (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })()
    : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload?.token ?? null;
      state.user = action.payload?.user ?? null;
      if (typeof localStorage !== 'undefined') {
        if (state.token) localStorage.setItem('token', state.token);
        if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
