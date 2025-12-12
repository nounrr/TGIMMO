import { baseApi } from '../../api/baseApi';

export const proprietairesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProprietaires: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Pagination
        if (params.page) queryParams.append('page', params.page);
        if (params.per_page) queryParams.append('per_page', params.per_page);
        
        // Recherche
        if (params.q) queryParams.append('q', params.q);
        
        // Filtre par type
        if (params.type_proprietaire && params.type_proprietaire !== 'all') {
          queryParams.append('type', params.type_proprietaire);
        }

        // Filtre par statut
        if (params.statut && params.statut !== 'all') {
          queryParams.append('statut', params.statut);
        }
        
        const queryString = queryParams.toString();
        return `/proprietaires${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Proprietaire'],
    }),
    getProprietaire: builder.query({
      query: (id) => `/proprietaires/${id}`,
      providesTags: (result, error, id) => [{ type: 'Proprietaire', id }],
    }),
    createProprietaire: builder.mutation({
      query: (body) => ({
        url: '/proprietaires',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Proprietaire'],
    }),
    updateProprietaire: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/proprietaires/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Proprietaire', id }, 'Proprietaire'],
    }),
    deleteProprietaire: builder.mutation({
      query: (id) => ({
        url: `/proprietaires/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Proprietaire'],
    }),
  }),
});

export const {
  useGetProprietairesQuery,
  useGetProprietaireQuery,
  useCreateProprietaireMutation,
  useUpdateProprietaireMutation,
  useDeleteProprietaireMutation,
} = proprietairesApi;
