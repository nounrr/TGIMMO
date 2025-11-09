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
  tagTypes: ['User', 'Users', 'Role', 'Permission', 'Locataire', 'Proprietaire', 'Unite', 'Prestataire', 'UniteOwnerships', 'Mandat', 'Avenant', 'Bail', 'RemiseCle'],
  endpoints: (builder) => ({
    // Current user
    getMe: builder.query({
      query: () => ({ url: 'me' }),
      providesTags: ['User'],
    }),
    // Example endpoint to demonstrate usage
    getUnites: builder.query({
      query: (params) => ({ url: 'unites', params }),
      providesTags: (result) =>
        result?.data ? [...result.data.map(() => ({ type: 'Unite' })), { type: 'Unite' }] : [{ type: 'Unite' }],
    }),
    getProprietaires: builder.query({
      query: (params) => ({ url: 'proprietaires', params }),
      providesTags: (result) =>
        result?.data ? [...result.data.map(() => ({ type: 'Proprietaire' })), { type: 'Proprietaire' }] : [{ type: 'Proprietaire' }],
    }),
    getUniteOwnerGroups: builder.query({
      query: (uniteId) => ({ url: `unites/${uniteId}/owners-groups` }),
      providesTags: (_result, _err, arg) => [{ type: 'UniteOwnerships', id: arg }],
    }),
    saveUniteOwnerGroup: builder.mutation({
      query: ({ uniteId, payload }) => ({
        url: `unites/${uniteId}/owners-groups`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'UniteOwnerships', id: arg.uniteId }],
    }),
    // Mandats de gestion
    getMandats: builder.query({
      query: (params) => ({ url: 'mandats-gestion', params }),
      providesTags: (result) => result?.data ? result.data.map((m) => ({ type: 'Mandat', id: m.id })) : [{ type: 'Mandat' }],
    }),
    getMandat: builder.query({
      query: (id) => ({ url: `mandats-gestion/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Mandat', id }],
    }),
    createMandat: builder.mutation({
      query: (payload) => ({
        url: 'mandats-gestion',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Mandat'],
    }),
    updateMandat: builder.mutation({
      query: ({ id, payload }) => ({
        url: `mandats-gestion/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Mandat', id: arg.id }],
    }),
    // Avenants au mandat
    getAvenants: builder.query({
      query: (params) => ({ url: 'avenants-mandat', params }),
      providesTags: (result) => result?.data ? result.data.map((a) => ({ type: 'Avenant', id: a.id })) : [{ type: 'Avenant' }],
    }),
    getAvenant: builder.query({
      query: (id) => ({ url: `avenants-mandat/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Avenant', id }],
    }),
    updateAvenant: builder.mutation({
      query: ({ id, payload }) => {
        let body = payload;
        let headers = {};
        if (payload instanceof FormData) {
          // fetchBaseQuery will set correct headers except content-type (left for browser to add boundary)
          payload.append('_method', 'PUT');
          body = payload;
        } else if (payload.file) {
          const fd = new FormData();
          fd.append('_method', 'PUT');
          Object.entries(payload).forEach(([k,v]) => {
            if (k === 'file' && v) fd.append('fichier', v);
            else if (v !== undefined && v !== null) fd.append(k, v);
          });
          body = fd;
        } else {
          // No file, use PUT directly
          return {
            url: `avenants-mandat/${id}`,
            method: 'PUT',
            body: payload,
            headers,
          };
        }
        return {
          url: `avenants-mandat/${id}`,
          method: 'POST', // Laravel will treat as PUT via _method
          body,
          headers,
        };
      },
      invalidatesTags: (_res, _err, arg) => [{ type: 'Avenant', id: arg.id }],
    }),
    createAvenant: builder.mutation({
      query: (payload) => {
        let body = payload;
        if (payload instanceof FormData) {
          body = payload;
        } else if (payload.file) {
          const fd = new FormData();
            Object.entries(payload).forEach(([k,v]) => {
              if (k === 'file' && v) fd.append('fichier', v);
              else fd.append(k, v);
            });
          body = fd;
        }
        return {
          url: 'avenants-mandat',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Avenant'],
    }),

    // Baux locatifs
    getBaux: builder.query({
      query: (params) => ({ url: 'baux', params }),
      providesTags: (result) => result?.data ? result.data.map((b) => ({ type: 'Bail', id: b.id })) : [{ type: 'Bail' }],
    }),
    getBail: builder.query({
      query: (id) => ({ url: `baux/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Bail', id }],
    }),
    createBail: builder.mutation({
      query: (payload) => ({
        url: 'baux',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Bail'],
    }),
    updateBail: builder.mutation({
      query: ({ id, payload }) => ({
        url: `baux/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Bail', id: arg.id }],
    }),
    deleteBail: builder.mutation({
      query: (id) => ({
        url: `baux/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bail'],
    }),

    // Remises de clés (par bail)
    getRemisesCles: builder.query({
      query: (bailId) => ({ url: `baux/${bailId}/remises-cles` }),
      providesTags: (_res, _err, bailId) => [{ type: 'Bail', id: bailId }],
    }),
    createRemiseCle: builder.mutation({
      query: ({ bailId, payload }) => ({
        url: `baux/${bailId}/remises-cles`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Bail', id: arg.bailId }],
    }),
    // Remises de clés globales
    getAllRemisesCles: builder.query({
      query: (params) => ({ url: 'remises-cles', params }),
      providesTags: (result) => result?.data ? result.data.map(r => ({ type: 'RemiseCle', id: r.id })) : [{ type: 'RemiseCle' }],
    }),
  }),
});

export const { useGetMeQuery, useGetUnitesQuery, useGetProprietairesQuery, useGetUniteOwnerGroupsQuery, useSaveUniteOwnerGroupMutation, useGetMandatsQuery, useGetMandatQuery, useCreateMandatMutation, useUpdateMandatMutation, useGetAvenantsQuery, useGetAvenantQuery, useCreateAvenantMutation, useUpdateAvenantMutation, useGetBauxQuery, useGetBailQuery, useCreateBailMutation, useUpdateBailMutation, useDeleteBailMutation, useGetRemisesClesQuery, useCreateRemiseCleMutation, useGetAllRemisesClesQuery } = baseApi;
