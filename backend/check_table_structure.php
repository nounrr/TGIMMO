<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = DB::select('DESCRIBE mandats_gestion');

echo "Structure de la table mandats_gestion:\n";
echo str_repeat('-', 80) . "\n";
foreach($columns as $col) {
    echo sprintf("%-30s | %-20s | %-5s | %-5s\n", 
        $col->Field, 
        $col->Type, 
        $col->Null, 
        $col->Key
    );
}
