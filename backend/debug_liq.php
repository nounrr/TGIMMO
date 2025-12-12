<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\BailPaiement;

$month = 11;
$year = 2025;

echo "Checking for Month: $month, Year: $year\n";

$payments = BailPaiement::where('period_month', $month)
    ->where('period_year', $year)
    ->get();

echo "Total Payments found: " . $payments->count() . "\n";

foreach ($payments as $p) {
    echo "Payment ID: {$p->id}, Status: {$p->status}, Bail ID: {$p->bail_id}\n";
    
    $bail = DB::table('baux')->where('id', $p->bail_id)->first();
    if ($bail) {
        echo "  -> Bail found. Unite ID: {$bail->unite_id}\n";
        
        // $owners = DB::table('unites_proprietaires')->where('unite_id', $bail->unite_id)->get();
// Updated to use MandatGestion
$mandat = \App\Models\MandatGestion::where('unite_id', $bail->unite_id)
    ->where('statut', 'actif')
    ->latest('id')
    ->first();
$owners = $mandat ? $mandat->unitesProprietaires : collect([]);
        echo "  -> Owners count: " . $owners->count() . "\n";
        foreach ($owners as $o) {
            echo "    -> Owner ID: {$o->proprietaire_id}\n";
        }
    } else {
        echo "  -> Bail NOT found!\n";
    }
}

$ownersWithPayments = DB::table('bail_paiements')
    ->join('baux', 'bail_paiements.bail_id', '=', 'baux.id')
    ->join('mandats_gestion', function($join) {
        $join->on('baux.unite_id', '=', 'mandats_gestion.unite_id')
             ->where('mandats_gestion.statut', '=', 'actif');
    })
    ->join('unites_proprietaires', 'mandats_gestion.id', '=', 'unites_proprietaires.mandat_id')
    ->where('bail_paiements.period_month', $month)
    ->where('bail_paiements.period_year', $year)
    ->where('bail_paiements.status', 'valide')
    ->distinct()
    ->pluck('unites_proprietaires.proprietaire_id');

echo "Owners found via Query: " . $ownersWithPayments->count() . "\n";
print_r($ownersWithPayments->toArray());
