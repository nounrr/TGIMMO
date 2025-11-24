<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

$ownerId = 14; // Using an existing owner
$unitIds = [3, 13];

foreach ($unitIds as $unitId) {
    $exists = DB::table('unites_proprietaires')
        ->where('unite_id', $unitId)
        ->where('proprietaire_id', $ownerId)
        ->exists();

    if (!$exists) {
        DB::table('unites_proprietaires')->insert([
            'unite_id' => $unitId,
            'proprietaire_id' => $ownerId,
            'part_pourcent' => 100,
            'date_debut' => Carbon::now()->subYear(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "Assigned Owner $ownerId to Unit $unitId\n";
    } else {
        echo "Owner $ownerId already assigned to Unit $unitId\n";
    }
}
