<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
    // Create roles with guard 'api'
    $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
    $employe = Role::firstOrCreate(['name' => 'employe', 'guard_name' => 'api']);

        // Permissions par ressource
        $usersPerms = ['users.view','users.create','users.update','users.delete'];
        $locPerms = ['locataires.view','locataires.create','locataires.update','locataires.delete'];
    $propPerms = ['proprietaires.view','proprietaires.create','proprietaires.update','proprietaires.delete'];
    $unitePerms = ['unites.view','unites.create','unites.update','unites.delete'];
    $mandatPerms = ['mandats.view','mandats.create','mandats.update','mandats.delete'];
    $avenantPerms = ['avenants.view','avenants.create','avenants.update','avenants.delete'];
    $bailPerms = ['baux.view','baux.create','baux.update','baux.delete'];
    $remisePerms = ['remises-cles.view','remises-cles.create','remises-cles.update','remises-cles.delete'];
        // Gestion rôles & permissions (admin UI côté front)
        $rolePerms = ['roles.view','roles.create','roles.update','roles.delete','roles.sync-permissions'];
        $permPerms = ['permissions.view'];
        // Gestion des rôles des utilisateurs
        $userRoleOps = ['users.roles.assign','users.roles.revoke','users.roles.sync'];

        $permissions = array_merge(
            $usersPerms,
            $locPerms,
            $propPerms,
            $unitePerms,
            $mandatPerms,
            $avenantPerms,
            $bailPerms,
            $remisePerms,
            $rolePerms,
            $permPerms,
            $userRoleOps
        );

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        // Assigner toutes les permissions à admin
    $admin->givePermissionTo(Permission::whereIn('name', $permissions)->pluck('name')->all());

    // Rôle employé: accorde les droits complets sur mandats & avenants, et lecture de base sur autres modules
    $employe->givePermissionTo(array_merge(
        $mandatPerms,
        $avenantPerms,
        $bailPerms, // employé peut gérer les baux
        ['locataires.view','proprietaires.view','unites.view','remises-cles.view']
    ));
    }
}
