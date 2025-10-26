import { baseApi } from '../../api/baseApi';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List users (employees)
    getUsers: builder.query({
      query: (params = {}) => ({ url: 'users', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((u) => ({ type: 'Users', id: u.id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),

    // Single user
    getUser: builder.query({
      query: (id) => ({ url: `users/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),

    // Create user
    createUser: builder.mutation({
      query: (body) => ({ url: 'users', method: 'POST', body }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),

    // Update user
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `users/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // Delete user
    deleteUser: builder.mutation({
      query: (id) => ({ url: `users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
