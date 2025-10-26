<?php

namespace Database\Factories;

use App\Models\Locataire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Locataire>
 */
class LocataireFactory extends Factory
{
    protected $model = Locataire::class;

    public function definition(): array
    {
        $faker = $this->faker;
        $type = $faker->randomElement(['personne', 'societe']);
        $isPerson = $type === 'personne';

        $nom = $isPerson ? $faker->lastName() : null;
        $prenom = $isPerson ? $faker->firstName() : null;
        $raisonSociale = $isPerson ? null : $faker->company();

        return [
            'type_personne' => $type,
            'nom' => $nom,
            'prenom' => $prenom,
            'raison_sociale' => $raisonSociale,
            'date_naissance' => $isPerson ? $faker->date() : null,
            'lieu_naissance' => $isPerson ? $faker->city() : null,
            'date_creation_entreprise' => $isPerson ? null : $faker->date(),
            'nationalite' => $faker->country(),
            'situation_familiale' => $isPerson ? $faker->randomElement(['celibataire','marie','divorce','veuf']) : null,
            'nb_personnes_foyer' => $isPerson ? $faker->numberBetween(1,6) : null,
            'cin' => $isPerson ? strtoupper($faker->bothify('??######')) : null,
            'rc' => $isPerson ? null : strtoupper($faker->bothify('RC#######')),
            'ice' => $isPerson ? null : $faker->numerify('###########'),
            'ifiscale' => $faker->numerify('########'),
            'adresse_bien_loue' => $faker->address(),
            'adresse_actuelle' => $faker->address(),
            'telephone' => $faker->phoneNumber(),
            'email' => $faker->unique()->safeEmail(),
            'profession_activite' => $isPerson ? $faker->jobTitle() : 'societe',
            'employeur_denomination' => $isPerson ? $faker->company() : $raisonSociale,
            'employeur_adresse' => $faker->address(),
            'type_contrat' => $faker->randomElement(['CDI','CDD','independant','societe','autre']),
            'revenu_mensuel_net' => $isPerson ? $faker->randomFloat(2, 2500, 25000) : null,
            'chiffre_affaires_dernier_ex' => $isPerson ? null : $faker->randomFloat(2, 100000, 5000000),
            'exercice_annee' => (int) $faker->year(),
            'anciennete_mois' => $faker->numberBetween(0, 240),
            'references_locatives' => $faker->paragraph(),
        ];
    }
}
