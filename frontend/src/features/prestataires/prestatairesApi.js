import { baseApi } from '../../api/baseApi';

export const prestatairesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrestataires: builder.query({
      query: (params = {}) => ({ url: 'prestataires', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((p) => ({ type: 'Prestataire', id: p.id })),
              { type: 'Prestataire', id: 'LIST' },
            ]
          : [{ type: 'Prestataire', id: 'LIST' }],
    }),

    getPrestataire: builder.query({
      query: (id) => ({ url: `prestataires/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Prestataire', id }],
    }),

    createPrestataire: builder.mutation({
      query: (body) => ({ url: 'prestataires', method: 'POST', body }),
      invalidatesTags: [{ type: 'Prestataire', id: 'LIST' }],
    }),

    updatePrestataire: builder.mutation({
      query: ({ id, ...body }) => ({ url: `prestataires/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Prestataire', id },
        { type: 'Prestataire', id: 'LIST' },
      ],
    }),

    deletePrestataire: builder.mutation({
      query: (id) => ({ url: `prestataires/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Prestataire', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPrestatairesQuery,
  useGetPrestataireQuery,
  useCreatePrestataireMutation,
  useUpdatePrestataireMutation,
  useDeletePrestataireMutation,
} = prestatairesApi;
