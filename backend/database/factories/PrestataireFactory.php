<?php

namespace Database\Factories;

use App\Models\Prestataire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Prestataire>
 */
class PrestataireFactory extends Factory
{
    protected $model = Prestataire::class;

    public function definition(): array
    {
        return [
            'nom_raison' => $this->faker->company(),
            'adresse' => $this->faker->address(),
            'telephone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->companyEmail(),
            'rc' => $this->faker->optional()->bothify('RC-#######'),
            'ifiscale' => $this->faker->optional()->bothify('IF-########'),
            'ice' => $this->faker->optional()->bothify('ICE-###########'),
            'domaine_activite' => $this->faker->randomElement(['Informatique','Maintenance','Nettoyage','Sécurité','Consulting','Autre']),
            'contact_nom' => $this->faker->name(),
            'rib' => $this->faker->bothify('####################'),
        ];
    }
}
