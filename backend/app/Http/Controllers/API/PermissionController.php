<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:permissions.view')->only(['index']);
    }

    public function index(Request $request)
    {
        $query = Permission::query()->where('guard_name','api')->orderBy('name');
        if ($search = $request->query('q')) {
            $query->where('name','like',"%{$search}%");
        }
        return response()->json($query->paginate($request->integer('per_page', 50)));
    }
}
