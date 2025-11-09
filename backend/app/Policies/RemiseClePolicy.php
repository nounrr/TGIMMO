<?php

namespace App\Policies;

use App\Models\User;
use App\Models\RemiseCle;
use App\Models\Bail;

class RemiseClePolicy
{
    /**
     * Autoriser la liste globale des remises de clés
     */
    public function viewAny(User $user): bool
    {
        return $user->can('remises-cles.view');
    }

    public function view(User $user, $args): bool
    {
        return $user->can('remises-cles.view');
    }

    public function create(User $user, $args): bool
    {
        return $user->can('remises-cles.create');
    }

    public function update(User $user, RemiseCle $remise): bool
    {
        return $user->can('remises-cles.update');
    }

    public function delete(User $user, RemiseCle $remise): bool
    {
        return $user->can('remises-cles.delete');
    }
}
