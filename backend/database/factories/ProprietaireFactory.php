<?php

namespace Database\Factories;

use App\Models\Proprietaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Proprietaire>
 */
class ProprietaireFactory extends Factory
{
    protected $model = Proprietaire::class;

    public function definition(): array
    {
        $faker = $this->faker;
        $type = $faker->randomElement(['unique','coproprietaire','heritier','sci','autre']);
        $statut = $faker->randomElement(['brouillon','signe','actif','resilie']);

        return [
            'nom_raison' => $faker->company(),
            'cin' => $faker->optional()->bothify('??######'),
            'rc' => $faker->optional()->bothify('RC#######'),
            'ice' => $faker->optional()->numerify('###########'),
            'ifiscale' => $faker->optional()->numerify('########'),
            'adresse' => $faker->address(),
            'telephone' => $faker->phoneNumber(),
            'email' => $faker->safeEmail(),
            'representant_nom' => $faker->optional()->name(),
            'representant_fonction' => $faker->optional()->jobTitle(),
            'representant_cin' => $faker->optional()->bothify('??######'),
            'type_proprietaire' => $type,
            'statut' => $statut,
            'taux_gestion_tgi_pct' => $faker->optional()->randomFloat(2, 0, 20),
            'part_liquidation_pct' => $faker->optional()->randomFloat(2, 0, 100),
            'conditions_particulieres' => $faker->optional()->paragraph(),
        ];
    }
}
