<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Passport\HasApiTokens;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
// Champs par défaut
        'name',
        'email',
        'password',
        'fonction',
        'service',
        'telephone_interne',
        'statut',
        'photo',
        'status_add_allowed',
        'status_edit_allowed',
        'status_view_allowed',
        'status_delete_allowed',
    ];

    /**
     * Attributes to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'photo_url',
    ];

    /**
     * Accessor for full photo URL.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) {
            return null;
        }
        // If already a full URL, return as is
        if (str_starts_with($this->photo, 'http://') || str_starts_with($this->photo, 'https://')) {
            return $this->photo;
        }
        return Storage::disk('public')->url($this->photo);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Spatie Permission utilise par défaut le garde 'web'.
     * On définit 'api' pour ce modèle afin d'utiliser les middlewares côté API.
     */
    public string $guard_name = 'api';
}
