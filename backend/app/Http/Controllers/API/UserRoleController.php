<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserRoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:users.roles.assign')->only(['assign']);
        $this->middleware('permission:users.roles.sync')->only(['sync']);
        $this->middleware('permission:users.update')->only(['revoke', 'syncPermissions']);
        $this->middleware('permission:users.view')->only(['listRoles', 'listPermissions']);
    }

    public function assign(Request $request, User $user)
    {
        $data = $request->validate([
            'roles' => ['required','array','min:1'],
            'roles.*' => ['string','distinct']
        ]);
        $roles = Role::whereIn('name', $data['roles'])->where('guard_name','api')->pluck('name')->all();
        foreach ($roles as $roleName) {
            $user->assignRole($roleName);
        }
        return response()->json(['roles' => $user->getRoleNames()]);
    }

    public function revoke(User $user, Role $role)
    {
        abort_unless($role->guard_name === 'api', 404);
        if ($role->name === 'admin' && $user->hasRole('admin')) {
            return response()->json(['message' => "Impossible de révoquer le rôle 'admin' ici."], 422);
        }
        $user->removeRole($role);
        return response()->json(['roles' => $user->getRoleNames()]);
    }

    public function sync(Request $request, User $user)
    {
        \Log::info('UserRoleController::sync payload', ['user_id' => $user->id, 'roles' => $request->input('roles')]);
        $data = $request->validate([
            'roles' => ['required','array'],
            'roles.*' => ['required'] // Allow string name or int ID
        ]);
        
        // Find roles by name OR id
        $roles = Role::where('guard_name', 'api')
            ->where(function($q) use ($data) {
                $q->whereIn('name', $data['roles'])
                  ->orWhereIn('id', $data['roles']);
            })
            ->pluck('name')
            ->all();

        \Log::info('UserRoleController::sync found roles', ['roles' => $roles]);

        $user->syncRoles($roles);
        return response()->json(['roles' => $user->getRoleNames()]);
    }

    public function listRoles(User $user)
    {
        return response()->json(['roles' => $user->getRoleNames()]);
    }

    public function listPermissions(User $user)
    {
        return response()->json(['permissions' => $user->getAllPermissions()->pluck('name')]);
    }

    public function syncPermissions(Request $request, User $user)
    {
        $data = $request->validate([
            'permissions' => ['required', 'array'],
        ]);

        $input = $data['permissions'] ?? [];

        // Map numeric IDs to permission names; allow strings to pass through
        $idToName = Permission::where('guard_name', 'api')->whereIn('id', collect($input)->filter(fn($v) => is_numeric($v))->all())
            ->pluck('name', 'id');

        $names = collect($input)
            ->map(function ($v) use ($idToName) {
                if (is_numeric($v)) {
                    $name = $idToName->get((int) $v);
                    return $name ?: null;
                }
                if (is_string($v)) {
                    return $v;
                }
                return null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();

        // Only sync permissions scoped to API guard
        // Filter names to those existing in API guard
        $validNames = Permission::where('guard_name', 'api')->whereIn('name', $names)->pluck('name')->all();

        $user->syncPermissions($validNames);

        return response()->json([
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'direct_permissions' => $user->permissions()->pluck('name'),
        ]);
    }
}
