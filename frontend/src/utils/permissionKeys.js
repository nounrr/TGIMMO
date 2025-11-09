export const PERMS = {
  locataires: {
    view: 'locataires.view',
    create: 'locataires.create',
    update: 'locataires.update',
    delete: 'locataires.delete',
  },
  proprietaires: {
    view: 'proprietaires.view',
    create: 'proprietaires.create',
    update: 'proprietaires.update',
    delete: 'proprietaires.delete',
  },
  unites: {
    view: 'unites.view',
    create: 'unites.create',
    update: 'unites.update',
    delete: 'unites.delete',
  },
  roles: {
    view: 'roles.view',
    create: 'roles.create',
    update: 'roles.update',
    delete: 'roles.delete',
    syncPermissions: 'roles.sync-permissions',
  },
  permissions: {
    view: 'permissions.view',
  },
  users: {
    view: 'users.view',
    create: 'users.create',
    update: 'users.update',
    delete: 'users.delete',
    rolesAssign: 'users.roles.assign',
    rolesRevoke: 'users.roles.revoke',
    rolesSync: 'users.roles.sync',
  },
  prestataires: {
    view: 'prestataires.view',
    create: 'prestataires.create',
    update: 'prestataires.update',
    delete: 'prestataires.delete',
  },
  mandats: {
    view: 'mandats.view',
    create: 'mandats.create',
    update: 'mandats.update',
    delete: 'mandats.delete',
  },
  avenants: {
    view: 'avenants.view',
    create: 'avenants.create',
    update: 'avenants.update',
    delete: 'avenants.delete',
  },
  baux: {
    view: 'baux.view',
    create: 'baux.create',
    update: 'baux.update',
    delete: 'baux.delete',
  },
  remises_cles: {
    view: 'remises-cles.view',
    create: 'remises-cles.create',
    update: 'remises-cles.update',
    delete: 'remises-cles.delete',
  },
};
