import { baseApi } from '../../api/baseApi';

export const gedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query({
      query: (params) => ({
        url: '/ged',
        params,
      }),
      providesTags: ['GedDocument'],
    }),
    uploadDocuments: builder.mutation({
      query: (formData) => ({
        url: '/ged',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['GedDocument'],
    }),
    attachDocument: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ged/${id}/attach`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GedDocument'],
    }),
    detachDocument: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ged/${id}/detach`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GedDocument'],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/ged/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GedDocument'],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useUploadDocumentsMutation,
  useAttachDocumentMutation,
  useDetachDocumentMutation,
  useDeleteDocumentMutation,
} = gedApi;
