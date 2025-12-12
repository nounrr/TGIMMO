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
use App\Http\Controllers\API\ReclamationTypeController;
use App\Http\Controllers\API\ReclamationController;
use App\Http\Controllers\API\JustificationReclamationController;
use App\Http\Controllers\API\InterventionController;
use App\Http\Controllers\API\DevisController;
use App\Http\Controllers\API\FactureController;
use App\Http\Controllers\API\DevisDocumentController;
use App\Http\Controllers\API\FactureDocumentController;
use App\Http\Controllers\API\BailPaiementController;
use App\Http\Controllers\API\BailChargesController;
use App\Http\Controllers\API\FranchiseBailController;
use App\Http\Controllers\ApprocheProprietaireController;
use App\Http\Controllers\ApprocheLocataireController;
use App\Http\Controllers\ImputationChargeController;
use App\Http\Controllers\API\LiquidationController;
use App\Http\Controllers\API\MaintenanceController;
use App\Http\Controllers\GedController;

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

        // Liquidations
        Route::get('liquidations/pending', [LiquidationController::class, 'pending'])->middleware('can:liquidations.create');
        Route::get('liquidations', [LiquidationController::class, 'index'])->middleware('can:liquidations.view');
        Route::post('liquidations/preview', [LiquidationController::class, 'preview'])->middleware('can:liquidations.create');
        Route::post('liquidations', [LiquidationController::class, 'store'])->middleware('can:liquidations.create');

        // Maintenance utilities (restrict with appropriate permission)
        Route::post('maintenance/fix-missing-ownerships', [MaintenanceController::class, 'fixMissingOwnerships'])->middleware('can:unites.update');

        // Locataires API (CRUD)
        Route::apiResource('locataires', LocataireController::class);

        // Users API (CRUD) - réservé aux admins pour l'écriture
        Route::apiResource('users', UserController::class);

        // Propriétaires API (CRUD)
        Route::apiResource('proprietaires', ProprietaireController::class);

        // Unités (CRUD)
        Route::get('unites/immeubles', [UniteController::class, 'getImmeubles']);
        Route::apiResource('unites', UniteController::class);

    // Prestataires (CRUD)
    Route::apiResource('prestataires', PrestataireController::class);

        // Mandats de gestion (CRUD)
        Route::apiResource('mandats-gestion', MandatGestionController::class)
            ->parameters(['mandats-gestion' => 'mandats_gestion']);
        Route::get('mandats-gestion/{mandats_gestion}/docx', [MandatGestionController::class, 'downloadDocx'])->name('mandats-gestion.docx');
        // PDF generation is handled on the frontend now
        // Route::get('mandats-gestion/{mandats_gestion}/pdf', [MandatGestionController::class, 'downloadPdf'])->name('mandats-gestion.pdf');
        // Route::post('mandats-gestion/{mandats_gestion}/generate-pdf', [MandatGestionController::class, 'generatePdf'])->name('mandats-gestion.generate-pdf');
        Route::get('mandats-gestion/{mandats_gestion}/editor-template', [MandatGestionController::class, 'editorTemplate'])->middleware('permission:mandats.view');
        Route::post('mandats-gestion/{mandats_gestion}/render-preview', [MandatGestionController::class, 'renderPreview'])->middleware('permission:mandats.view');

        // Avenants au mandat (CRUD)
        Route::apiResource('avenants-mandat', AvenantMandatController::class)
            ->parameters(['avenants-mandat' => 'avenants_mandat']);
        Route::get('avenants-mandat/{avenants_mandat}/docx', [AvenantMandatController::class, 'downloadDocx'])->name('avenants-mandat.docx');

        // Baux locatifs (CRUD)
        Route::apiResource('baux', BailController::class);
        Route::get('baux/{bail}/pdf', [BailController::class, 'downloadPdf'])->name('baux.pdf');
        Route::get('baux/{bail}/docx', [BailController::class, 'downloadDocx'])->name('baux.docx');
        Route::get('baux/{bail}/editor-template', [BailController::class, 'editorTemplate'])->middleware('permission:baux.view');
        Route::post('baux/{bail}/render-preview', [BailController::class, 'renderPreview'])->middleware('permission:baux.view');
        Route::get('baux/{bail}/resiliation-template', [BailController::class, 'resiliationTemplate'])->middleware('permission:baux.view');
        Route::post('baux/{bail}/render-resiliation-preview', [BailController::class, 'renderResiliationPreview'])->middleware('permission:baux.view');
        
        // Franchises (remises) des baux
        Route::get('baux/{bail}/franchises', [FranchiseBailController::class, 'index']);
        Route::post('franchises', [FranchiseBailController::class, 'store']);
        Route::get('franchises/{franchise}', [FranchiseBailController::class, 'show']);
        Route::patch('franchises/{franchise}', [FranchiseBailController::class, 'update']);
        Route::delete('franchises/{franchise}', [FranchiseBailController::class, 'destroy']);
        Route::post('baux/{bail}/calculer-loyer', [FranchiseBailController::class, 'calculerLoyer']);
        
        // Charges mensuelles du bail
        Route::get('baux/{bail}/charges-mensuelles', [BailChargesController::class, 'index']);
        // Paiements mensuels du bail
        Route::get('paiements/all-baux', [BailPaiementController::class, 'getAllBauxWithPaiements']);
        Route::get('baux/{bail}/paiements', [BailPaiementController::class, 'index']);
        Route::post('baux/{bail}/paiements', [BailPaiementController::class, 'store']);
        Route::patch('paiements/{paiement}', [BailPaiementController::class, 'update']);
        Route::post('paiements/{paiement}/valider', [BailPaiementController::class, 'valider']);
    // Remises de clés liées à un bail
    Route::get('baux/{bail}/remises-cles', [RemiseCleController::class, 'index']);
    Route::post('baux/{bail}/remises-cles', [RemiseCleController::class, 'store']);
    Route::get('remises-cles', [RemiseCleController::class, 'all']);
    Route::get('remises-cles/{remiseCle}', [RemiseCleController::class, 'show']);
    Route::put('remises-cles/{remiseCle}', [RemiseCleController::class, 'update']);
    Route::get('remises-cles/{remiseCle}/editor-template', [RemiseCleController::class, 'editorTemplate']);
    Route::post('remises-cles/{remiseCle}/render-preview', [RemiseCleController::class, 'renderPreview']);

        // Réclamations
        Route::apiResource('reclamation-types', ReclamationTypeController::class)
            ->parameters(['reclamation-types' => 'reclamation_type']);
        Route::apiResource('reclamations', ReclamationController::class);
        Route::get('reclamations/{reclamation}/docx', [ReclamationController::class, 'downloadDocx'])->name('reclamations.docx');
        Route::post('reclamations/{reclamation}/justifications', [JustificationReclamationController::class, 'store']);
        Route::delete('reclamations/{reclamation}/justifications/{justification}', [JustificationReclamationController::class, 'destroy']);

    // Interventions (CRUD)
    Route::get('interventions/natures', [InterventionController::class, 'getNatures']);
    Route::apiResource('interventions', InterventionController::class);
    Route::get('interventions/{intervention}/docx', [InterventionController::class, 'downloadDocx'])->name('interventions.docx');

    // Devis & Factures (CRUD) + GED nested
    Route::apiResource('devis', DevisController::class);
    Route::get('devis/{devi}/docx', [DevisController::class, 'downloadDocx'])->name('devis.docx');
    Route::post('devis/{devi}/documents', [DevisDocumentController::class, 'store']);

    // Imputation Charges
    Route::apiResource('imputation-charges', ImputationChargeController::class);

    Route::apiResource('factures', FactureController::class);
    Route::get('factures/{facture}/docx', [FactureController::class, 'downloadDocx'])->name('factures.docx');
    Route::post('factures/{facture}/documents', [FactureDocumentController::class, 'store']);
    Route::delete('factures/{facture}/documents/{document}', [FactureDocumentController::class, 'destroy']);

        // Approches (notes / interactions) sur propriétaires & locataires
        Route::apiResource('approche-proprietaires', ApprocheProprietaireController::class);
        Route::apiResource('approche-locataires', ApprocheLocataireController::class);

        // Répartition propriétaires par unité
        Route::get('unites/{unite}/owners-groups', [UniteProprietaireController::class, 'index']);
        Route::post('unites/{unite}/owners-groups', [UniteProprietaireController::class, 'store']);
        Route::post('unites/{unite}/owners-groups/status', [UniteProprietaireController::class, 'updateStatus']);
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

        // GED (Document management) with permissions
        Route::get('ged', [GedController::class, 'index'])->middleware('permission:ged.view');
        Route::get('ged/{id}', [GedController::class, 'show'])->middleware('permission:ged.view');
        Route::post('ged', [GedController::class, 'store'])->middleware('permission:ged.upload');
        Route::patch('ged/{id}', [GedController::class, 'update'])->middleware('permission:ged.update');
        Route::delete('ged/{id}', [GedController::class, 'destroy'])->middleware('permission:ged.delete');
        Route::post('ged/{id}/attach', [GedController::class, 'attach'])->middleware('permission:ged.link');
        Route::post('ged/{id}/detach', [GedController::class, 'detach'])->middleware('permission:ged.link');
    });
});
