<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CommercialRoleSeeder extends Seeder
{
    public function run(): void
    {
        // Créer le rôle commercial
        $role = Role::firstOrCreate(['name' => 'commercial']);

        // Permissions nécessaires (normalisées avec des tirets pour correspondre aux policies & frontend)
        $permissions = [
            // Approches (locataires & proprietaires)
            'approches-locataires.view',
            'approches-locataires.create',
            'approches-locataires.update',
            'approches-proprietaires.view',
            'approches-proprietaires.create',
            'approches-proprietaires.update',
            
            // Création et modification des entités
            'locataires.create',
            'locataires.update',  // Pour changer le statut
            'proprietaires.create',
            'proprietaires.update',  // Pour changer le statut
            'unites.create',
            'unites.update',  // Pour changer le statut
            
            // Lecture seule sur les listes globales
            'locataires.view',
            'proprietaires.view',
            'unites.view',

            // Permissions de consultation pour éviter les erreurs 403 sur les relations
            'baux.view', 'interventions.view', 'reclamations.view', 'devis.view', 'factures.view',
        ];

        // Créer les permissions si elles n'existent pas
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        // Assigner les permissions au rôle
        $role->syncPermissions($permissions);
    }
}
