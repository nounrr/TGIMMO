<?php

namespace Database\Factories;

use App\Models\Bail;
use Illuminate\Database\Eloquent\Factories\Factory;

class BailFactory extends Factory
{
    protected $model = Bail::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-1 month', 'now');
        $end = (clone $start)->modify('+1 year');
        return [
            'numero_bail' => 'BL-' . strtoupper($this->faker->bothify('??-####')),
            'type_bien' => $this->faker->randomElement(['appartement','bureau','local_commercial','autre']),
            'adresse_bien' => $this->faker->address(),
            'superficie' => $this->faker->optional()->randomFloat(2, 20, 300),
            'etage_bloc' => $this->faker->optional()->randomElement(['RDC','1','2','3']),
            'nombre_pieces' => $this->faker->optional()->numberBetween(1,8),
            'nombre_sdb' => $this->faker->optional()->numberBetween(1,3),
            'garage' => $this->faker->boolean(20),
            'date_debut' => $start->format('Y-m-d'),
            'date_fin' => $end->format('Y-m-d'),
            'duree' => 12,
            'montant_loyer' => $this->faker->randomFloat(2, 2000, 15000),
            'charges' => $this->faker->randomFloat(2, 0, 500),
            'depot_garantie' => $this->faker->randomFloat(2, 0, 3000),
            'mode_paiement' => $this->faker->randomElement(['virement','cheque','espece']),
            'renouvellement_auto' => $this->faker->boolean(30),
            'clause_particuliere' => $this->faker->optional()->sentence(),
            'observations' => $this->faker->optional()->paragraph(),
            'equipements' => json_encode(['eau','electricite']),
            'statut' => 'actif',
        ];
    }
}
