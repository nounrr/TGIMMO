<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:roles.view')->only(['index', 'show']);
        $this->middleware('permission:roles.create')->only(['store']);
        $this->middleware('permission:roles.update')->only(['update']);
        $this->middleware('permission:roles.delete')->only(['destroy']);
        $this->middleware('permission:roles.sync-permissions')->only(['syncPermissions']);
    }

    public function index(Request $request)
    {
        $include = $request->boolean('withPermissions');
        $query = Role::query()->where('guard_name', 'api');
        if ($include) {
            $query->with('permissions');
        }
        return response()->json($query->orderBy('name')->paginate($request->integer('per_page', 15)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255', Rule::unique('roles','name')->where('guard_name','api')],
            'permissions' => ['array'],
            'permissions.*' => ['string','distinct'],
            'status_add_allowed' => ['nullable', 'string'],
            'status_edit_allowed' => ['nullable', 'string'],
            'status_view_allowed' => ['nullable', 'string'],
            'status_delete_allowed' => ['nullable', 'string'],
        ]);

        $role = new Role();
        $role->name = $data['name'];
        $role->guard_name = 'api';
        $role->status_add_allowed = $data['status_add_allowed'] ?? null;
        $role->status_edit_allowed = $data['status_edit_allowed'] ?? null;
        $role->status_view_allowed = $data['status_view_allowed'] ?? null;
        $role->status_delete_allowed = $data['status_delete_allowed'] ?? null;
        $role->save();

        if (!empty($data['permissions'])) {
            $perms = Permission::whereIn('name', $data['permissions'])->where('guard_name','api')->pluck('name');
            $role->syncPermissions($perms);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function show(Role $role)
    {
        abort_unless($role->guard_name === 'api', 404);
        return response()->json($role->load('permissions'));
    }

    public function update(Request $request, Role $role)
    {
        abort_unless($role->guard_name === 'api', 404);

        $data = $request->validate([
            'name' => ['sometimes','required','string','max:255', Rule::unique('roles','name')->where('guard_name','api')->ignore($role->id)],
            'permissions' => ['sometimes','array'],
            'permissions.*' => ['string','distinct'],
            'status_add_allowed' => ['nullable', 'string'],
            'status_edit_allowed' => ['nullable', 'string'],
            'status_view_allowed' => ['nullable', 'string'],
            'status_delete_allowed' => ['nullable', 'string'],
        ]);

        if (array_key_exists('name', $data)) {
            if ($role->name === 'admin') {
                return response()->json(['message' => "Le rôle 'admin' ne peut pas être renommé."], 422);
            }
            $role->name = $data['name'];
        }

        foreach (['status_add_allowed', 'status_edit_allowed', 'status_view_allowed', 'status_delete_allowed'] as $field) {
            if (array_key_exists($field, $data)) {
                $role->$field = $data[$field];
            }
        }

        $role->save();

        if (array_key_exists('permissions', $data)) {
            $perms = Permission::whereIn('name', $data['permissions'])->where('guard_name','api')->pluck('name');
            $role->syncPermissions($perms);
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
        abort_unless($role->guard_name === 'api', 404);
        if ($role->name === 'admin') {
            return response()->json(['message' => "Le rôle 'admin' ne peut pas être supprimé."], 422);
        }
        // Optionnel: empêcher suppression si des utilisateurs y sont rattachés
        if (method_exists($role, 'users') && $role->users()->exists()) {
            return response()->json(['message' => "Impossible de supprimer un rôle assigné à des utilisateurs."], 422);
        }
        $role->delete();
        return response()->json([], 204);
    }

    public function syncPermissions(Request $request, Role $role)
    {
        abort_unless($role->guard_name === 'api', 404);
        $data = $request->validate([
            'permissions' => ['required','array'],
            'permissions.*' => ['string','distinct']
        ]);
        $perms = Permission::whereIn('name', $data['permissions'])->where('guard_name','api')->pluck('name');
        $role->syncPermissions($perms);
        return response()->json($role->load('permissions'));
    }
}
