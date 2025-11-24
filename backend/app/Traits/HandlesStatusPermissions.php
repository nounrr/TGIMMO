<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait HandlesStatusPermissions
{
    /**
     * Apply status-based filtering to the query.
     *
     * @param Builder $query
     * @param string $resourceName e.g., 'locataires', 'proprietaires'
     * @return Builder
     */
    protected function applyStatusPermissions(Builder $query, string $resourceName): Builder
    {
        $user = Auth::user();

        // If user has permission to view all statuses, return query as is
        if ($user->can("{$resourceName}.view.all_statuses")) {
            return $query;
        }

        // Otherwise, filter by allowed statuses
        // We check all permissions the user has that match "{resourceName}.status.*"
        // This is a bit complex because we can't easily query "all permissions matching pattern" from the user object efficiently in a loop
        // But we can get all user permissions and filter them.
        
        // Optimization: Get all permissions for the user once
        $permissions = $user->getAllPermissions()->pluck('name');
        
        $allowedStatuses = $permissions
            ->filter(function ($perm) use ($resourceName) {
                return str_starts_with($perm, "{$resourceName}.status.");
            })
            ->map(function ($perm) use ($resourceName) {
                return str_replace("{$resourceName}.status.", '', $perm);
            })
            ->values()
            ->toArray();

        if (empty($allowedStatuses)) {
            // If no specific status is allowed and no "view all", return empty result (or handle as forbidden)
            // Returning empty result is safer for lists
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('statut', $allowedStatuses);
    }
}
