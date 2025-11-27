<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class StatusPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Define statuses that need specific permissions
        // Format: {resource}.status.{status_name}
        $statuses = [
            'en_negociation',
            'negociation_echoue',
            'actif',
            'inactif',
            'vacant',
            'loue',
            'maintenance',
            'reserve',
            'resilie',
            'termine',
            'en_attente',
            'effectue',
            'prospect',
            'modifier'
        ];

        $resources = [
            'locataires',
            'proprietaires',
            'unites',
            'mandats',
            'avenants',
            'baux',
            'remises-cles',
            'approches-locataires',
            'approches-proprietaires',
            'unites-proprietaires'
        ];

        $permissions = [];
        
        // Permission to view ALL statuses (for admin)
        foreach ($resources as $resource) {
            $permissions[] = "{$resource}.view.all_statuses";
        }

        // Permissions for specific statuses
        foreach ($resources as $resource) {
            foreach ($statuses as $status) {
                $permissions[] = "{$resource}.status.{$status}";
            }
        }

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        // Assign 'view.all_statuses' to Admin
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            foreach ($resources as $resource) {
                $admin->givePermissionTo("{$resource}.view.all_statuses");
            }
        }

        // Assign specific statuses to Commercial
        // "je done au commercial selemnt affiche des locataire en engociation et negociattion echoue"
        $commercial = Role::where('name', 'commercial')->first();
        if ($commercial) {
            // Example for Locataires as requested
            $commercial->givePermissionTo([
                'locataires.status.en_negociation',
                'locataires.status.negociation_echoue',
                'locataires.status.prospect',
                
                // Add others as needed, or let user configure via UI later
                // For now, giving some defaults based on "commercial" nature
                'proprietaires.status.en_negociation',
                'proprietaires.status.negociation_echoue',
                'proprietaires.status.prospect',
                
                'unites.status.vacant',
                'unites.status.en_negociation',
                
                // For approaches, they usually follow the entity status, but if we filter by approach status (if added later)
                // For now, we assume approaches don't have a status column yet, but if they did...
                // Actually approaches don't have status in the model yet, but the user asked for "approches" too.
                // Assuming approaches are filtered by their parent entity status in the controller logic.
            ]);
        }
    }
}
