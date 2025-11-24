<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ApprocheLocataire;

class ApprocheLocatairePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('approches-locataires.view');
    }

    public function view(User $user, ApprocheLocataire $approche): bool
    {
        return $user->can('approches-locataires.view');
    }

    public function create(User $user): bool
    {
        return $user->can('approches-locataires.create');
    }

    public function update(User $user, ApprocheLocataire $approche): bool
    {
        return $user->can('approches-locataires.update');
    }

    public function delete(User $user, ApprocheLocataire $approche): bool
    {
        return $user->can('approches-locataires.delete');
    }
}
