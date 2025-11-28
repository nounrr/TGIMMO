try {
    $email = 'tinker'.time().'@test.com';
    echo "Creating user with email: $email\n";
    
    $user = App\Models\User::create([
        'name' => 'Tinker Test', 
        'email' => $email, 
        'password' => 'password'
    ]);
    
    echo "User created with ID: " . $user->id . "\n";
    
    $roleName = 'employe';
    $guard = 'api';
    echo "Finding role: $roleName ($guard)\n";
    
    $role = Spatie\Permission\Models\Role::findByName($roleName, $guard);
    
    echo "Assigning role...\n";
    $user->assignRole($role);
    
    echo "Roles assigned: " . $user->getRoleNames() . "\n";
    
    echo "Checking model_has_roles table:\n";
    $roles = DB::table('model_has_roles')->where('model_id', $user->id)->get();
    dump($roles);
    
    echo "Checking model_has_permissions table (Direct permissions - expected empty if using roles):\n";
    $perms = DB::table('model_has_permissions')->where('model_id', $user->id)->get();
    dump($perms);

    echo "Verifying effective permissions:\n";
    $permToCheck = 'locataires.create';
    $hasPerm = $user->hasPermissionTo($permToCheck);
    echo "User has permission '$permToCheck': " . ($hasPerm ? 'YES' : 'NO') . "\n";

    $permToCheck2 = 'users.delete'; // Should be false for commercial
    $hasPerm2 = $user->hasPermissionTo($permToCheck2);
    echo "User has permission '$permToCheck2': " . ($hasPerm2 ? 'YES' : 'NO') . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
