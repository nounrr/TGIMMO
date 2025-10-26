import { baseApi } from '../../api/baseApi';

export const unitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnites: builder.query({
      query: ({ page = 1, per_page = 10, search = '', type_unite = '', statut = '' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', per_page.toString());
        if (search) params.append('q', search);
        if (type_unite) params.append('type_unite', type_unite);
        if (statut) params.append('statut', statut);
        params.append('withLocataire', 'true');
        
        return `/unites?${params.toString()}`;
      },
      providesTags: ['Unite'],
    }),
    getUnite: builder.query({
      query: (id) => `/unites/${id}?withLocataire=true`,
      providesTags: (result, error, id) => [{ type: 'Unite', id }],
    }),
    createUnite: builder.mutation({
      query: (data) => ({
        url: '/unites',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Unite'],
    }),
    updateUnite: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/unites/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Unite', id }, 'Unite'],
    }),
    deleteUnite: builder.mutation({
      query: (id) => ({
        url: `/unites/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Unite'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUnitesQuery,
  useGetUniteQuery,
  useCreateUniteMutation,
  useUpdateUniteMutation,
  useDeleteUniteMutation,
} = unitesApi;
