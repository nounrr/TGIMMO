<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new user (API).
     */
    public function register(Request $request)
    {
        return response()->json(['message' => 'Registration is disabled'], 403);
    }

    /**
     * Login user and issue token.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $validated['email'])->first();
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants invalides'], 422);
        }
        if ($user->statut === 'inactif') {
            return response()->json(['message' => 'Compte inactif'], 403);
        }

    // Passport v13 returns a PersonalAccessTokenResult with an accessToken string property
    $tokenResult = $user->createToken('api');
    $accessToken = $tokenResult->accessToken;

        // Augmenter la réponse avec rôles & permissions et photo_url
        $user->loadMissing('roles');
        $userArray = $user->toArray();
        $userArray['roles'] = $user->getRoleNames();
        $userArray['permissions'] = $user->getAllPermissions()->pluck('name')->values();
        $userArray['photo_url'] = $user->photo ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->photo) : null;

        return response()->json([
            'user' => $userArray,
            'token_type' => 'Bearer',
            'access_token' => $accessToken,
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('roles');
        $userArray = $user->toArray();
        $userArray['roles'] = $user->getRoleNames();
        $userArray['permissions'] = $user->getAllPermissions()->pluck('name')->values();
        $userArray['photo_url'] = $user->photo ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->photo) : null;
        return response()->json($userArray);
    }

    /**
     * Update authenticated user's basic profile fields.
     */
    public function updateMe(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'telephone_interne' => ['nullable', 'string', 'max:50'],
        ]);

        // Only allow specific fields
        $allowed = array_intersect_key($data, array_flip(['name', 'telephone_interne']));
        $user->fill($allowed);
        $user->save();

        $fresh = $user->fresh();
        $fresh->loadMissing('roles');
        $freshArray = $fresh->toArray();
        $freshArray['roles'] = $fresh->getRoleNames();
        $freshArray['permissions'] = $fresh->getAllPermissions()->pluck('name')->values();
        $freshArray['photo_url'] = $fresh->photo ? \Illuminate\Support\Facades\Storage::disk('public')->url($fresh->photo) : null;

        return response()->json([
            'message' => 'Profil mis à jour',
            'user' => $freshArray,
        ]);
    }

    /**
     * Logout (revoke current token).
     */
    public function logout(Request $request)
    {
        $token = $request->user()->token();
        if ($token) {
            $token->revoke();
        }
        return response()->json(['message' => 'Déconnecté']);
    }

    /**
     * Upload and update profile photo for the authenticated user.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        // Delete old photo if exists and stored locally
        if ($user->photo && !str_starts_with($user->photo, 'http')) {
            Storage::disk('public')->delete($user->photo);
        }

        $path = $request->file('photo')->store('avatars', 'public');
        $user->photo = $path;
        $user->save();

        return response()->json([
            'message' => 'Photo mise à jour',
            'photo' => $user->photo,
            'photo_url' => Storage::disk('public')->url($user->photo),
            'user' => $user->fresh(),
        ]);
    }
}
