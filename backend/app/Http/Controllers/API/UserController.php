<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:users.view')->only(['index', 'show']);
        $this->middleware('permission:users.create')->only(['store']);
        $this->middleware('permission:users.update')->only(['update']);
        $this->middleware('permission:users.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $q = User::query();
        if ($search = $request->query('q')) {
            $q->where(function ($s) use ($search) {
                $s->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($role = $request->query('role')) {
            $q->whereHas('roles', function ($r) use ($role) {
                $r->where('name', $role);
            });
        }
        if ($request->boolean('withRoles')) {
            $q->with('roles');
        }
        $perPage = (int) $request->query('per_page', 15);
        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request, true);
        $user = new User();
        $user->fill($data);
        // Hash du mot de passe
        $user->password = Hash::make($data['password']);
        $user->save();

        if (!empty($data['role'])) {
            // Gérer les rôles uniquement via Spatie (model_has_roles)
            $user->assignRole($data['role']);
        }

        return response()->json($user, 201);
    }

    public function show(Request $request, User $user)
    {
        // Autoriser l'accès à soi-même ou à ceux qui ont la permission users.view
        if ($request->user()->id !== $user->id && !$request->user()->can('users.view')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $user->loadMissing($request->boolean('withRoles') ? 'roles' : []);
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $data = $this->validateData($request, false, $user);
        $user->fill($data);
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        if (array_key_exists('role', $data) && $data['role'] !== null) {
            // Ne plus utiliser users.role_id; uniquement Spatie roles
            $user->syncRoles([$data['role']]);
        }

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }

    private function validateData(Request $request, bool $creating, ?User $user = null): array
    {
        $uniqueEmail = Rule::unique('users', 'email');
        if ($user) {
            $uniqueEmail = $uniqueEmail->ignore($user->id);
        }

        $rules = [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:150'],
            'fonction' => ['nullable', 'string', 'max:150'],
            'service' => ['nullable', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', $uniqueEmail],
            'telephone_interne' => ['nullable', 'string', 'max:50'],
            'statut' => ['nullable', Rule::in(['actif', 'inactif'])],
            'role' => ['nullable'],
            'password' => [$creating ? 'required' : 'nullable', 'string', 'min:8'],
        ];

        $data = $request->validate($rules);

        // Garantir statut par défaut
        if (!isset($data['statut'])) {
            $data['statut'] = 'actif';
        }

        return $data;
    }

    // Note: autorisations gérées via middleware et vérification ciblée dans show()
}
