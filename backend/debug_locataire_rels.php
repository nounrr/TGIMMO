<?php

use App\Models\Locataire;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$locataire = Locataire::with(['bauxActifs.unite.proprietaires'])->first();

if ($locataire) {
    echo "Locataire: " . $locataire->nom . "\n";
    echo "Baux Actifs Count: " . $locataire->bauxActifs->count() . "\n";
    if ($locataire->bauxActifs->count() > 0) {
        $bail = $locataire->bauxActifs->first();
        echo "Bail ID: " . $bail->id . "\n";
        echo "Unite: " . ($bail->unite ? $bail->unite->id : 'None') . "\n";
        if ($bail->unite) {
            echo "Proprietaires Count: " . $bail->unite->proprietaires->count() . "\n";
            foreach ($bail->unite->proprietaires as $p) {
                echo " - " . $p->nom_raison . " (" . $p->nom . ")\n";
            }
        }
    }
    
    // Check JSON structure
    $json = json_encode($locataire->toArray());
    echo "\nJSON Key check:\n";
    if (strpos($json, 'baux_actifs') !== false) {
        echo "Found 'baux_actifs' in JSON\n";
    } else {
        echo "NOT Found 'baux_actifs' in JSON. Keys: " . implode(', ', array_keys($locataire->toArray())) . "\n";
    }
} else {
    echo "No locataire found.\n";
}
