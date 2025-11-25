import { baseApi } from '../../api/baseApi';

export const unitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnites: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        // Defaults
        if (!params.page) searchParams.append('page', '1');
        if (!params.per_page) searchParams.append('per_page', '10');
        searchParams.append('withLocataire', 'true');

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            // Map 'search' to 'q' if needed, or just pass through
            if (key === 'search') {
               searchParams.append('q', value);
            } else {
               searchParams.append(key, value);
            }
          }
        });
        
        return `/unites?${searchParams.toString()}`;
      },
      providesTags: ['Unite'],
    }),
    getImmeubles: builder.query({
      query: () => '/unites/immeubles',
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
  useGetImmeublesQuery,
  useGetUniteQuery,
  useCreateUniteMutation,
  useUpdateUniteMutation,
  useDeleteUniteMutation,
} = unitesApi;
