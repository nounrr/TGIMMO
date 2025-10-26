import { baseApi } from '../../api/baseApi';
import { setCredentials, clearCredentials } from './authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: 'login', method: 'POST', body }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const token = data?.access_token;
          const user = data?.user;
          if (token) {
            localStorage.setItem('token', token);
            if (user) localStorage.setItem('user', JSON.stringify(user));
            dispatch(setCredentials({ token, user }));
          }
        } catch (e) {
          // noop
        }
      },
    }),
    me: builder.query({
      query: () => ({ url: 'me' }),
      providesTags: ['User'],
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const state = getState();
          const token = state.auth?.token || localStorage.getItem('token');
          const user = data?.user || data; // support either {user} or raw user
          if (token && user) {
            localStorage.setItem('user', JSON.stringify(user));
            dispatch(setCredentials({ token, user }));
          }
        } catch {}
      },
    }),
    uploadPhoto: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        return {
          url: 'me/photo',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['User'],
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const state = getState();
          const token = state.auth?.token || localStorage.getItem('token');
          if (data?.user && token) {
            localStorage.setItem('user', JSON.stringify(data.user));
            dispatch(setCredentials({ token, user: data.user }));
          }
        } catch {}
      },
    }),
    updateMe: builder.mutation({
      query: (body) => ({ url: 'me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const state = getState();
          const token = state.auth?.token || localStorage.getItem('token');
          if (data?.user && token) {
            localStorage.setItem('user', JSON.stringify(data.user));
            dispatch(setCredentials({ token, user: data.user }));
          }
        } catch {}
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: 'logout', method: 'POST' }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(clearCredentials());
      },
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useLogoutMutation, useUploadPhotoMutation, useUpdateMeMutation } = authApi;
