<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\LocataireController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ProprietaireController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\PermissionController;
use App\Http\Controllers\API\UserRoleController;
use App\Http\Controllers\API\UniteController;
use App\Http\Controllers\API\PrestataireController;
use App\Http\Controllers\API\UniteProprietaireController;
use App\Http\Controllers\API\MandatGestionController;
use App\Http\Controllers\API\AvenantMandatController;
use App\Http\Controllers\API\BailController;
use App\Http\Controllers\API\RemiseCleController;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/me', [AuthController::class, 'updateMe']);
        Route::post('/me/photo', [AuthController::class, 'uploadPhoto']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Exemple de routes protégées par rôle/permission (Spatie)
        Route::middleware('role:admin')->get('/admin/ping', function () {
            return response()->json(['message' => 'pong admin']);
        });

        // Locataires API (CRUD)
        Route::apiResource('locataires', LocataireController::class);

        // Users API (CRUD) - réservé aux admins pour l'écriture
        Route::apiResource('users', UserController::class);

        // Propriétaires API (CRUD)
        Route::apiResource('proprietaires', ProprietaireController::class);

        // Unités (CRUD)
        Route::apiResource('unites', UniteController::class);

    // Prestataires (CRUD)
    Route::apiResource('prestataires', PrestataireController::class);

        // Mandats de gestion (CRUD)
        Route::apiResource('mandats-gestion', MandatGestionController::class)
            ->parameters(['mandats-gestion' => 'mandats_gestion']);

        // Avenants au mandat (CRUD)
        Route::apiResource('avenants-mandat', AvenantMandatController::class)
            ->parameters(['avenants-mandat' => 'avenants_mandat']);

        // Baux locatifs (CRUD)
        Route::apiResource('baux', BailController::class);
        Route::get('baux/{bail}/pdf', [BailController::class, 'downloadPdf'])->name('baux.pdf');
    // Remises de clés liées à un bail
    Route::get('baux/{bail}/remises-cles', [RemiseCleController::class, 'index']);
    Route::post('baux/{bail}/remises-cles', [RemiseCleController::class, 'store']);
    Route::get('remises-cles', [RemiseCleController::class, 'all']);

        // Répartition propriétaires par unité
        Route::get('unites/{unite}/owners-groups', [UniteProprietaireController::class, 'index']);
        Route::post('unites/{unite}/owners-groups', [UniteProprietaireController::class, 'store']);
        Route::delete('unites/{unite}/ownerships/{ownership}', [UniteProprietaireController::class, 'destroy']);

        // Rôles (CRUD) & Permissions listing
        Route::apiResource('roles', RoleController::class);
        Route::post('roles/{role}/permissions/sync', [RoleController::class, 'syncPermissions']);
        Route::get('permissions', [PermissionController::class, 'index']);

        // Gestion des rôles des utilisateurs
        Route::post('users/{user}/roles/assign', [UserRoleController::class, 'assign']);
        Route::post('users/{user}/roles/sync', [UserRoleController::class, 'sync']);
        Route::delete('users/{user}/roles/{role}', [UserRoleController::class, 'revoke']);
        Route::get('users/{user}/roles', [UserRoleController::class, 'listRoles']);
        Route::get('users/{user}/permissions', [UserRoleController::class, 'listPermissions']);
        Route::post('users/{user}/permissions/sync', [UserRoleController::class, 'syncPermissions']);
    });
});
