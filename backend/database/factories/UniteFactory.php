<?php

namespace Database\Factories;

use App\Models\Unite;
use Illuminate\Database\Eloquent\Factories\Factory;

class UniteFactory extends Factory
{
    protected $model = Unite::class;

    public function definition(): array
    {
        $types = ['appartement','bureau','local_commercial','garage','autre'];
        $statuts = ['vacant','loue','maintenance','reserve'];
        return [
            'numero_unite' => 'U-'.strtoupper($this->faker->bothify('??-####')),
            'adresse_complete' => $this->faker->address(),
            'immeuble' => $this->faker->optional()->word(),
            'bloc' => $this->faker->optional()->bothify('B-#'),
            'etage' => $this->faker->optional()->randomElement(['RDC','1','2','3','4','5']),
            'type_unite' => $this->faker->randomElement($types),
            'superficie_m2' => $this->faker->optional()->randomFloat(2, 10, 500),
            'nb_pieces' => $this->faker->optional()->numberBetween(1, 10),
            'nb_sdb' => $this->faker->optional()->numberBetween(1, 4),
            'equipements' => $this->faker->optional()->text(120),
            'mobilier' => $this->faker->optional()->text(120),
            'statut' => $this->faker->randomElement($statuts),
            'locataire_actuel_id' => null,
            'bail_actuel_id' => null,
            'date_entree_actuelle' => $this->faker->optional()->date(),
        ];
    }
}
