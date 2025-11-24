<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ApprocheProprietaire;

class ApprocheProprietairePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('approches-proprietaires.view');
    }

    public function view(User $user, ApprocheProprietaire $approche): bool
    {
        return $user->can('approches-proprietaires.view');
    }

    public function create(User $user): bool
    {
        return $user->can('approches-proprietaires.create');
    }

    public function update(User $user, ApprocheProprietaire $approche): bool
    {
        return $user->can('approches-proprietaires.update');
    }

    public function delete(User $user, ApprocheProprietaire $approche): bool
    {
        return $user->can('approches-proprietaires.delete');
    }
}
