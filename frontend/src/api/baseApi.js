import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Users', 'Role', 'Permission', 'Locataire', 'Proprietaire', 'Unite', 'Prestataire'],
  endpoints: (builder) => ({
    // Example endpoint to demonstrate usage
    getUnites: builder.query({
      query: (params) => ({ url: 'unites', params }),
      providesTags: (result) =>
        result?.data ? [...result.data.map(() => ({ type: 'Unite' })), { type: 'Unite' }] : [{ type: 'Unite' }],
    }),
  }),
});

export const { useGetUnitesQuery } = baseApi;
