<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class StatusPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we start from a clean permission cache (important for idempotent seeds)
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

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
            // Idempotent creation – if exists, it's ignored
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        // Assign 'view.all_statuses' to Admin
        // Create role if missing with correct guard
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        if ($admin) {
            foreach ($resources as $resource) {
                $permName = "{$resource}.view.all_statuses";
                if (Permission::where('name', $permName)->where('guard_name','api')->exists() && !$admin->hasPermissionTo($permName)) {
                    $admin->givePermissionTo($permName);
                }
            }
        }

        // Assign specific statuses to Commercial
        // "je done au commercial selemnt affiche des locataire en engociation et negociattion echoue"
        $commercial = Role::firstOrCreate(['name' => 'commercial', 'guard_name' => 'api']);
        if ($commercial) {
            // Example for Locataires as requested
            $toGrant = [
                'locataires.status.en_negociation',
                'locataires.status.negociation_echoue',
                'locataires.status.prospect',
                // Suggested defaults for commercial
                'proprietaires.status.en_negociation',
                'proprietaires.status.negociation_echoue',
                'proprietaires.status.prospect',
                'unites.status.vacant',
                'unites.status.en_negociation',
            ];

            foreach ($toGrant as $permName) {
                if (Permission::where('name', $permName)->where('guard_name','api')->exists() && !$commercial->hasPermissionTo($permName)) {
                    $commercial->givePermissionTo($permName);
                }
            }
        }
    }
}
