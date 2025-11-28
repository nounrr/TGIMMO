<?php

use Illuminate\Http\Request;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\UserRoleController;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "--- Simulating User Creation ---\n";
    
    // Mock Request for Create
    $email = 'api_test_'.time().'@test.com';
    $createData = [
        'name' => 'API Test User',
        'email' => $email,
        'password' => 'password',
        'role' => 'employe' // Simulating what frontend sends
    ];
    
    $request = Request::create('/api/v1/users', 'POST', $createData);
    // Mock user for auth (admin)
    $admin = User::whereHas('roles', function($q){ $q->where('name', 'admin'); })->first();
    if(!$admin) { echo "No admin found to auth\n"; exit; }
    $request->setUserResolver(function () use ($admin) { return $admin; });

    $controller = app(UserController::class);
    $response = $controller->store($request);
    
    $content = $response->getContent();
    echo "Create Response: " . $content . "\n";
    $userData = json_decode($content, true);
    $userId = $userData['id'] ?? null;

    if ($userId) {
        echo "User created with ID: $userId\n";
        
        // Check roles immediately
        $user = User::find($userId);
        echo "Roles after create: " . $user->getRoleNames() . "\n";

        echo "--- Simulating Role Sync ---\n";
        // Mock Request for Sync
        // Frontend sends: { roles: ['employe'] }
        $syncData = [
            'roles' => ['employe']
        ];
        
        $syncRequest = Request::create("/api/v1/users/$userId/roles/sync", 'POST', $syncData);
        $syncRequest->setUserResolver(function () use ($admin) { return $admin; });
        
        $roleController = app(UserRoleController::class);
        $syncResponse = $roleController->sync($syncRequest, $user);
        
        echo "Sync Response: " . $syncResponse->getContent() . "\n";
        
        // Check roles after sync
        $user->refresh();
        echo "Roles after sync: " . $user->getRoleNames() . "\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
