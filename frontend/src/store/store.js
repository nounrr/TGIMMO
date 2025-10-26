import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import authReducer from '../features/auth/authSlice';

// Example slice placeholder (replace with real slices later)
const dummyReducer = (state = { ready: true }, action) => state;

export const store = configureStore({
  reducer: {
    app: dummyReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export default store;
