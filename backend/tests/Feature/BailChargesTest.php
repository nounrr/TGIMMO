<?php

namespace Tests\Feature;

use App\Models\Bail;
use App\Models\ImputationCharge;
use App\Models\Locataire;
use App\Models\Unite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;

class BailChargesTest extends TestCase
{
    use RefreshDatabase;

    public function test_bail_charges_mensuelles_endpoint_returns_structure()
    {
        // Désactive l'auth pour simplifier le test structurel
        $this->withoutMiddleware();

        $locataire = Locataire::factory()->create();
        $unite = Unite::factory()->create();
        $bail = Bail::factory()->create([
            'locataire_id' => $locataire->id,
            'unite_id' => $unite->id,
            'montant_loyer' => 5000,
            'charges' => 0,
        ]);

        // Create charges across two months
        ImputationCharge::factory()->create([
            'bail_id' => $bail->id,
            'charge_to' => 'locataire',
            'montant' => 150,
            'created_at' => now()->startOfMonth(),
        ]);
        ImputationCharge::factory()->create([
            'bail_id' => $bail->id,
            'charge_to' => 'proprietaire',
            'montant' => 300,
            'created_at' => now()->startOfMonth(),
        ]);
        ImputationCharge::factory()->create([
            'bail_id' => $bail->id,
            'charge_to' => 'locataire',
            'montant' => 200,
            'created_at' => now()->subMonth()->startOfMonth(),
        ]);

        $response = $this->getJson('/api/v1/baux/' . $bail->id . '/charges-mensuelles');
        $response->assertStatus(200);
        $json = $response->json();

        $this->assertArrayHasKey('bail_id', $json);
        $this->assertArrayHasKey('charges_mensuelles', $json);
        $this->assertNotNull($json['bail_id']);
        $this->assertIsArray($json['charges_mensuelles']);
        $first = $json['charges_mensuelles'][0];
        $this->assertArrayHasKey('mois', $first);
        $this->assertArrayHasKey('total', $first);
        $this->assertArrayHasKey('total_locataire', $first);
        $this->assertArrayHasKey('total_proprietaire', $first);
        $this->assertArrayHasKey('details', $first);
    }
}
