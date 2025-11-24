<?php

namespace Database\Factories;

use App\Models\ImputationCharge;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImputationChargeFactory extends Factory
{
    protected $model = ImputationCharge::class;

    public function definition(): array
    {
        return [
            'charge_to' => $this->faker->randomElement(['locataire','proprietaire']),
            'montant' => $this->faker->randomFloat(2, 50, 500),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
