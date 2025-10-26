import { baseApi } from '../../api/baseApi';

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Roles CRUD
    getRoles: builder.query({
      query: (params = {}) => ({ url: 'roles', params }),
      providesTags: (result) => {
        // Provide Role tags for cache invalidation
        const tags = [{ type: 'Role' }];
        if (result?.data) {
          result.data.forEach((role) => tags.push({ type: 'Role', id: role.id }));
        }
        return tags;
      },
    }),
    getRole: builder.query({
      query: ({ id, withPermissions = true }) => ({ url: `roles/${id}`, params: { withPermissions } }),
      providesTags: (result, error, arg) => [{ type: 'Role', id: arg.id }],
    }),
    createRole: builder.mutation({
      query: (body) => ({ url: 'roles', method: 'POST', body }),
      invalidatesTags: [{ type: 'Role' }, { type: 'Permission' }],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({ url: `roles/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, arg) => [{ type: 'Role' }, { type: 'Role', id: arg.id }, { type: 'Permission' }],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `roles/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Role' }],
    }),

    // Sync role permissions
    syncRolePermissions: builder.mutation({
      query: ({ id, permissions }) => ({
        url: `roles/${id}/permissions/sync`,
        method: 'POST',
        body: { permissions },
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Role' }, { type: 'Role', id: arg.id }, { type: 'Permission' }],
    }),

    // Permissions listing
    getPermissions: builder.query({
      query: (params = {}) => ({ url: 'permissions', params }),
      providesTags: (result) => {
        const tags = [{ type: 'Permission' }];
        if (result?.data) {
          result.data.forEach((p) => tags.push({ type: 'Permission', id: p.id }));
        }
        return tags;
      },
    }),

    // User <-> Role management
    getUserRoles: builder.query({
      query: (userId) => ({ url: `users/${userId}/roles` }),
      providesTags: (result, error, arg) => [{ type: 'User', id: arg }, { type: 'Role' }],
    }),
    getUserPermissions: builder.query({
      query: (userId) => ({ url: `users/${userId}/permissions` }),
      providesTags: (result, error, arg) => [{ type: 'User', id: arg }, { type: 'Permission' }],
    }),
    syncUserPermissions: builder.mutation({
      query: ({ userId, permissions }) => ({ url: `users/${userId}/permissions/sync`, method: 'POST', body: { permissions } }),
      invalidatesTags: (result, error, arg) => [
        { type: 'User' }, // invalidate current user (/me)
        { type: 'User', id: arg.userId },
        { type: 'Permission' },
      ],
    }),
    syncUserRoles: builder.mutation({
      query: ({ userId, roles }) => ({ url: `users/${userId}/roles/sync`, method: 'POST', body: { roles } }),
      invalidatesTags: (result, error, arg) => [
        { type: 'User' },
        { type: 'User', id: arg.userId },
        { type: 'Role' },
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useSyncRolePermissionsMutation,
  useGetPermissionsQuery,
  useGetUserRolesQuery,
  useGetUserPermissionsQuery,
  useSyncUserRolesMutation,
  useSyncUserPermissionsMutation,
} = rolesApi;
