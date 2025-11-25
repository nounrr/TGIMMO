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
  tagTypes: ['User', 'Users', 'Role', 'Permission', 'Locataire', 'Proprietaire', 'Unite', 'Prestataire', 'UniteOwnerships', 'Mandat', 'Avenant', 'Bail', 'BailCharges', 'RemiseCle', 'Reclamation', 'ReclamationType', 'JustificationReclamation', 'Intervention', 'Devis', 'Facture', 'Ged', 'ApprocheProprietaire', 'ApprocheLocataire', 'Paiement', 'ImputationCharge', 'Liquidation'],
  endpoints: (builder) => ({
    // Liquidations
    getLiquidations: builder.query({
      query: (params) => ({ url: 'liquidations', params }),
      providesTags: (result) => result?.data ? [...result.data.map(({ id }) => ({ type: 'Liquidation', id })), { type: 'Liquidation', id: 'LIST' }] : [{ type: 'Liquidation', id: 'LIST' }],
    }),
    getPendingLiquidations: builder.query({
      query: (params) => ({ url: 'liquidations/pending', params }),
      providesTags: ['Liquidation'],
    }),
    previewLiquidation: builder.mutation({
      query: (payload) => ({
        url: 'liquidations/preview',
        method: 'POST',
        body: payload,
      }),
    }),
    createLiquidation: builder.mutation({
      query: (payload) => ({
        url: 'liquidations',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'Liquidation', id: 'LIST' }, 'ImputationCharge'],
    }),
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

    // Paiements mensuels des baux
    getBailPaiements: builder.query({
      query: (bailId) => ({ url: `baux/${bailId}/paiements` }),
      providesTags: (result, _err, bailId) => result?.data ? [ { type: 'Bail', id: bailId }, ...result.data.map(p => ({ type: 'Paiement', id: p.id })) ] : [{ type: 'Bail', id: bailId }],
    }),
    createBailPaiement: builder.mutation({
      query: ({ bailId, payload }) => ({ url: `baux/${bailId}/paiements`, method: 'POST', body: payload }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Bail', id: arg.bailId }, { type: 'Paiement', id: 'LIST' }],
    }),
    updatePaiement: builder.mutation({
      query: ({ id, payload }) => ({ url: `paiements/${id}`, method: 'PATCH', body: payload }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Paiement', id: arg.id }],
    }),
    validerPaiement: builder.mutation({
      query: ({ id, method, reference, cheque_image }) => {
        let body;
        if (cheque_image) {
          const fd = new FormData();
          if (method) fd.append('method', method);
          if (reference) fd.append('reference', reference);
          fd.append('cheque_image', cheque_image);
          body = fd;
        } else {
          body = { method, reference };
        }
        return { url: `paiements/${id}/valider`, method: 'POST', body };
      },
      invalidatesTags: (_res, _err, arg) => [{ type: 'Paiement', id: arg.id }],
    }),
    // Charges mensuelles du bail (agrégées)
    getBailChargesMensuelles: builder.query({
      query: (bailId) => ({ url: `baux/${bailId}/charges-mensuelles` }),
      transformResponse: (response) => response?.charges_mensuelles || [],
      providesTags: (result, _err, bailId) => {
        const base = [
          { type: 'Bail', id: bailId },
          { type: 'BailCharges', id: bailId },
          { type: 'ImputationCharge', id: 'LIST' }
        ];
        if (!Array.isArray(result)) return base;
        return [
          ...base,
          ...result.flatMap(m => m.details?.map(d => ({ type: 'ImputationCharge', id: d.id })) || [])
        ];
      },
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

    // Reclamation Types
    getReclamationTypes: builder.query({
      query: () => ({ url: 'reclamation-types' }),
      // Normalize response so components can rely on array always
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      },
      providesTags: (result) => (result && result.length)
        ? result.map(t => ({ type: 'ReclamationType', id: t.id }))
        : [{ type: 'ReclamationType' }],
    }),
    createReclamationType: builder.mutation({
      query: (payload) => ({ url: 'reclamation-types', method: 'POST', body: payload }),
      invalidatesTags: ['ReclamationType'],
    }),
    updateReclamationType: builder.mutation({
      query: ({ id, payload }) => ({ url: `reclamation-types/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'ReclamationType', id: arg.id }],
    }),
    deleteReclamationType: builder.mutation({
      query: (id) => ({ url: `reclamation-types/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ReclamationType'],
    }),

    // Reclamations
    getReclamations: builder.query({
      query: (params) => ({ url: 'reclamations', params }),
      providesTags: (result) => result?.data ? result.data.map(r => ({ type: 'Reclamation', id: r.id })) : [{ type: 'Reclamation' }],
    }),
    getReclamation: builder.query({
      query: (id) => ({ url: `reclamations/${id}` }),
      providesTags: (_res,_err,id) => [{ type: 'Reclamation', id }],
    }),
    createReclamation: builder.mutation({
      query: (payload) => {
        let body = payload;
        if (!(payload instanceof FormData)) {
          const fd = new FormData();
          Object.entries(payload).forEach(([k,v]) => {
            if (k === 'files' && Array.isArray(v)) {
              v.forEach(f => fd.append('files[]', f));
            } else if (v !== undefined && v !== null) {
              fd.append(k, v);
            }
          });
          body = fd;
        }
        return { url: 'reclamations', method: 'POST', body };
      },
      invalidatesTags: ['Reclamation'],
    }),
    updateReclamation: builder.mutation({
      query: ({ id, payload }) => ({ url: `reclamations/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Reclamation', id: arg.id }],
    }),
    deleteReclamation: builder.mutation({
      query: (id) => ({ url: `reclamations/${id}` , method: 'DELETE' }),
      invalidatesTags: ['Reclamation'],
    }),
    uploadReclamationJustifs: builder.mutation({
      query: ({ id, files }) => {
        const fd = new FormData();
        files.forEach(f => fd.append('files[]', f));
        return { url: `reclamations/${id}/justifications`, method: 'POST', body: fd };
      },
      invalidatesTags: (_res,_err,arg) => [{ type: 'Reclamation', id: arg.id }],
    }),
    deleteReclamationJustif: builder.mutation({
      query: ({ id, justifId }) => ({ url: `reclamations/${id}/justifications/${justifId}`, method: 'DELETE' }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Reclamation', id: arg.id }],
    }),

    // Interventions
    getInterventionNatures: builder.query({
      query: () => ({ url: 'interventions/natures' }),
      providesTags: ['Intervention'],
    }),
    getInterventions: builder.query({
      query: (params) => ({ 
        url: 'interventions', 
        params: { 
          ...params, 
          with: params?.with || 'bail.locataire.unite,prestataire,reclamation' 
        } 
      }),
      providesTags: (result) => result?.data ? result.data.map(i => ({ type: 'Intervention', id: i.id })) : [{ type: 'Intervention' }],
    }),
    getIntervention: builder.query({
      query: (id) => ({ url: `interventions/${id}`, params: { with: 'bail.locataire.unite,prestataire,reclamation' } }),
      providesTags: (_res,_err,id) => [{ type: 'Intervention', id }],
    }),
    createIntervention: builder.mutation({
      query: (payload) => ({ url: 'interventions', method: 'POST', body: payload }),
      invalidatesTags: ['Intervention'],
    }),
    updateIntervention: builder.mutation({
      query: ({ id, payload }) => ({ url: `interventions/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Intervention', id: arg.id }],
    }),
    deleteIntervention: builder.mutation({
      query: (id) => ({ url: `interventions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Intervention'],
    }),
    // Devis
    getDevis: builder.query({
      query: (params) => ({ url: 'devis', params }),
      providesTags: (result) => result?.data ? result.data.map(d => ({ type: 'Devis', id: d.id })) : [{ type: 'Devis' }],
    }),
    createDevis: builder.mutation({
      query: (payload) => ({ url: 'devis', method: 'POST', body: payload }),
      invalidatesTags: ['Devis'],
    }),
    updateDevis: builder.mutation({
      query: ({ id, payload }) => ({ url: `devis/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Devis', id: arg.id }],
    }),
    deleteDevis: builder.mutation({
      query: (id) => ({ url: `devis/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Devis'],
    }),
    uploadDevisDocs: builder.mutation({
      query: ({ id, files, category }) => {
        const fd = new FormData();
        files.forEach(f => fd.append('files[]', f));
        if (category) fd.append('category', category);
        return { url: `devis/${id}/documents`, method: 'POST', body: fd };
      },
      invalidatesTags: (_res,_err,arg) => [{ type: 'Devis', id: arg.id }],
    }),
    deleteDevisDoc: builder.mutation({
      query: ({ id, docId }) => ({ url: `devis/${id}/documents/${docId}`, method: 'DELETE' }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Devis', id: arg.id }],
    }),
    // Factures
    getFactures: builder.query({
      query: (params) => ({ url: 'factures', params }),
      providesTags: (result) => result?.data ? result.data.map(f => ({ type: 'Facture', id: f.id })) : [{ type: 'Facture' }],
    }),
    createFacture: builder.mutation({
      query: (payload) => ({ url: 'factures', method: 'POST', body: payload }),
      invalidatesTags: ['Facture'],
    }),
    updateFacture: builder.mutation({
      query: ({ id, payload }) => ({ url: `factures/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Facture', id: arg.id }],
    }),
    deleteFacture: builder.mutation({
      query: (id) => ({ url: `factures/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Facture'],
    }),
    uploadFactureDocs: builder.mutation({
      query: ({ id, files, category }) => {
        const fd = new FormData();
        files.forEach(f => fd.append('files[]', f));
        if (category) fd.append('category', category);
        return { url: `factures/${id}/documents`, method: 'POST', body: fd };
      },
      invalidatesTags: (_res,_err,arg) => [{ type: 'Facture', id: arg.id }],
    }),
    deleteFactureDoc: builder.mutation({
      query: ({ id, docId }) => ({ url: `factures/${id}/documents/${docId}`, method: 'DELETE' }),
      invalidatesTags: (_res,_err,arg) => [{ type: 'Facture', id: arg.id }],
    }),

    // Approche Proprietaires
    getApprocheProprietaires: builder.query({
      query: (params) => ({ url: 'approche-proprietaires', params }),
      providesTags: (result) => result?.data ? result.data.map(i => ({ type: 'ApprocheProprietaire', id: i.id })) : [{ type: 'ApprocheProprietaire' }],
    }),
    getApprocheProprietaire: builder.query({
      query: (id) => ({ url: `approche-proprietaires/${id}` }),
      providesTags: (_res,_err,id) => [{ type: 'ApprocheProprietaire', id }],
    }),
    createApprocheProprietaire: builder.mutation({
      query: (payload) => ({ url: 'approche-proprietaires', method: 'POST', body: payload }),
      invalidatesTags: ['ApprocheProprietaire'],
    }),
    updateApprocheProprietaire: builder.mutation({
      query: ({ id, ...patch }) => {
        if (patch.data instanceof FormData) {
          return { url: `approche-proprietaires/${id}`, method: 'POST', body: patch.data };
        }
        return { url: `approche-proprietaires/${id}`, method: 'PUT', body: patch };
      },
      invalidatesTags: (_res,_err,arg) => [{ type: 'ApprocheProprietaire', id: arg.id }],
    }),
    deleteApprocheProprietaire: builder.mutation({
      query: (id) => ({ url: `approche-proprietaires/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ApprocheProprietaire'],
    }),

    // Approche Locataires
    getApprocheLocataires: builder.query({
      query: (params) => ({ url: 'approche-locataires', params }),
      providesTags: (result) => result?.data ? result.data.map(i => ({ type: 'ApprocheLocataire', id: i.id })) : [{ type: 'ApprocheLocataire' }],
    }),
    getApprocheLocataire: builder.query({
      query: (id) => ({ url: `approche-locataires/${id}` }),
      providesTags: (_res,_err,id) => [{ type: 'ApprocheLocataire', id }],
    }),
    createApprocheLocataire: builder.mutation({
      query: (payload) => ({ url: 'approche-locataires', method: 'POST', body: payload }),
      invalidatesTags: ['ApprocheLocataire'],
    }),
    updateApprocheLocataire: builder.mutation({
      query: ({ id, ...patch }) => {
        if (patch.data instanceof FormData) {
          return { url: `approche-locataires/${id}`, method: 'POST', body: patch.data };
        }
        return { url: `approche-locataires/${id}`, method: 'PUT', body: patch };
      },
      invalidatesTags: (_res,_err,arg) => [{ type: 'ApprocheLocataire', id: arg.id }],
    }),
    deleteApprocheLocataire: builder.mutation({
      query: (id) => ({ url: `approche-locataires/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ApprocheLocataire'],
    }),

    // Imputation Charges
    getImputationCharges: builder.query({
      query: (params) => ({ url: 'imputation-charges', params }),
      providesTags: (result) => 
        result?.data 
          ? [...result.data.map(i => ({ type: 'ImputationCharge', id: i.id })), { type: 'ImputationCharge', id: 'LIST' }] 
          : [{ type: 'ImputationCharge', id: 'LIST' }],
    }),
    getImputationCharge: builder.query({
      query: (id) => ({ url: `imputation-charges/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'ImputationCharge', id }],
    }),
    createImputationCharge: builder.mutation({
      query: (payload) => ({ url: 'imputation-charges', method: 'POST', body: payload }),
      invalidatesTags: (result) => {
        const imputeA = result?.data?.impute_a;
        const idImpute = result?.data?.id_impute;
        return [
          { type: 'ImputationCharge', id: 'LIST' },
          ...(imputeA === 'bail' && idImpute ? [{ type: 'BailCharges', id: idImpute }] : [])
        ];
      },
    }),
    updateImputationCharge: builder.mutation({
      query: ({ id, payload }) => ({ url: `imputation-charges/${id}`, method: 'PUT', body: payload }),
      invalidatesTags: (result, _err, arg) => {
        const imputeA = result?.data?.impute_a || arg?.payload?.impute_a;
        const idImpute = result?.data?.id_impute || arg?.payload?.id_impute;
        return [
          { type: 'ImputationCharge', id: arg.id },
          { type: 'ImputationCharge', id: 'LIST' },
          ...(imputeA === 'bail' && idImpute ? [{ type: 'BailCharges', id: idImpute }] : [])
        ];
      },
    }),
    deleteImputationCharge: builder.mutation({
      query: (id) => ({ url: `imputation-charges/${id}`, method: 'DELETE' }),
      invalidatesTags: (result) => {
        const imputeA = result?.data?.impute_a;
        const idImpute = result?.data?.id_impute;
        return [
          { type: 'ImputationCharge', id: 'LIST' },
          ...(imputeA === 'bail' && idImpute ? [{ type: 'BailCharges', id: idImpute }] : [])
        ];
      },
    }),
    getUnite: builder.query({
      query: (id) => ({ url: `unites/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Unite', id }],
    }),
    getProprietaire: builder.query({
      query: (id) => ({ url: `proprietaires/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Proprietaire', id }],
    }),
  }),
});

export const { 
  useGetMeQuery, 
  useGetUnitesQuery, 
  useGetProprietairesQuery, 
  useGetUniteOwnerGroupsQuery, 
  useSaveUniteOwnerGroupMutation, 
  useGetMandatsQuery, 
  useGetMandatQuery, 
  useCreateMandatMutation, 
  useUpdateMandatMutation, 
  useGetAvenantsQuery, 
  useGetAvenantQuery, 
  useCreateAvenantMutation, 
  useUpdateAvenantMutation, 
  useGetBauxQuery, 
  useGetBailQuery, 
  useCreateBailMutation, 
  useUpdateBailMutation, 
  useDeleteBailMutation, 
  useGetRemisesClesQuery, 
  useCreateRemiseCleMutation, 
  useGetAllRemisesClesQuery, 
  useGetReclamationTypesQuery, 
  useCreateReclamationTypeMutation, 
  useUpdateReclamationTypeMutation, 
  useDeleteReclamationTypeMutation, 
  useGetReclamationsQuery, 
  useGetReclamationQuery, 
  useCreateReclamationMutation, 
  useUpdateReclamationMutation, 
  useDeleteReclamationMutation, 
  useUploadReclamationJustifsMutation, 
  useDeleteReclamationJustifMutation, 
  useGetInterventionNaturesQuery,
  useGetInterventionsQuery, 
  useGetInterventionQuery, 
  useCreateInterventionMutation, 
  useUpdateInterventionMutation, 
  useDeleteInterventionMutation, 
  useGetDevisQuery, 
  useCreateDevisMutation, 
  useUpdateDevisMutation, 
  useDeleteDevisMutation, 
  useUploadDevisDocsMutation, 
  useDeleteDevisDocMutation, 
  useGetFacturesQuery, 
  useCreateFactureMutation, 
  useUpdateFactureMutation, 
  useDeleteFactureMutation, 
  useUploadFactureDocsMutation, 
  useDeleteFactureDocMutation, 
  useGetApprocheProprietairesQuery, 
  useGetApprocheProprietaireQuery, 
  useCreateApprocheProprietaireMutation, 
  useUpdateApprocheProprietaireMutation, 
  useDeleteApprocheProprietaireMutation, 
  useGetApprocheLocatairesQuery, 
  useGetApprocheLocataireQuery, 
  useCreateApprocheLocataireMutation, 
  useUpdateApprocheLocataireMutation, 
  useDeleteApprocheLocataireMutation, 
  useGetBailPaiementsQuery, 
  useCreateBailPaiementMutation, 
  useUpdatePaiementMutation, 
  useValiderPaiementMutation,
  useGetBailChargesMensuellesQuery,
  useGetImputationChargesQuery,
  useGetImputationChargeQuery,
  useCreateImputationChargeMutation,
  useUpdateImputationChargeMutation,
  useDeleteImputationChargeMutation,
  useGetUniteQuery,
  useGetProprietaireQuery,
  useGetLiquidationsQuery,
  useGetPendingLiquidationsQuery,
  usePreviewLiquidationMutation,
  useCreateLiquidationMutation,
} = baseApi;
