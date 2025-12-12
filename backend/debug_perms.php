try {
    $admin = App\Models\User::whereHas('roles', function($q) {
        $q->where('name', 'admin');
    })->first();

    if (!$admin) {
        echo "No admin user found.\n";
        exit;
    }

    echo "Admin User ID: " . $admin->id . "\n";
    echo "Guard Name in Model: " . $admin->guard_name . "\n";
    
    echo "Checking 'users.view' permission...\n";
    $can = $admin->can('users.view');
    echo "Can users.view? " . ($can ? 'YES' : 'NO') . "\n";

    echo "Roles:\n";
    dump($admin->getRoleNames());

    // Force check via guard
    echo "Checking via Auth::guard('api')->user()->can()...\n";
    // Mock login
    auth()->guard('api')->setUser($admin);
    $canApi = auth()->guard('api')->user()->can('users.view');
    echo "Can users.view (via api guard)? " . ($canApi ? 'YES' : 'NO') . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
