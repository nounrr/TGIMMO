<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Unites Proprietaires Count: " . DB::table('unites_proprietaires')->count() . "\n";
$all = DB::table('unites_proprietaires')->get();
foreach($all as $row) {
    print_r($row);
}

echo "\nUnites columns:\n";
$columns = DB::getSchemaBuilder()->getColumnListing('unites');
print_r($columns);
