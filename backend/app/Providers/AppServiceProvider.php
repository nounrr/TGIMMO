<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\RemiseCle;
use App\Policies\RemiseClePolicy;
use App\Models\ApprocheProprietaire;
use App\Policies\ApprocheProprietairePolicy;
use App\Models\ApprocheLocataire;
use App\Policies\ApprocheLocatairePolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(RemiseCle::class, RemiseClePolicy::class);
        Gate::policy(ApprocheProprietaire::class, ApprocheProprietairePolicy::class);
        Gate::policy(ApprocheLocataire::class, ApprocheLocatairePolicy::class);
    }
}
