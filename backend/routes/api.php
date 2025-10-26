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
