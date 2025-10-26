import { baseApi } from '../../api/baseApi';

export const locatairesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocataires: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Pagination
        if (params.page) queryParams.append('page', params.page);
        if (params.per_page) queryParams.append('per_page', params.per_page);
        
        // Recherche
        if (params.search) queryParams.append('q', params.search);
        
        // Filtre par type
        if (params.type && params.type !== 'all') {
          queryParams.append('type', params.type);
        }
        
        const queryString = queryParams.toString();
        return `/locataires${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Locataire'],
    }),
    getLocataire: builder.query({
      query: (id) => `/locataires/${id}`,
      providesTags: (result, error, id) => [{ type: 'Locataire', id }],
    }),
    createLocataire: builder.mutation({
      query: (body) => ({
        url: '/locataires',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Locataire'],
    }),
    updateLocataire: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/locataires/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Locataire', id }, 'Locataire'],
    }),
    deleteLocataire: builder.mutation({
      query: (id) => ({
        url: `/locataires/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Locataire'],
    }),
  }),
});

export const {
  useGetLocatairesQuery,
  useGetLocataireQuery,
  useCreateLocataireMutation,
  useUpdateLocataireMutation,
  useDeleteLocataireMutation,
} = locatairesApi;
