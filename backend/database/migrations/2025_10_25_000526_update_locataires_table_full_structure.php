<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('locataires', function (Blueprint $table) {
            // Identification
            $table->enum('type_personne', ['personne', 'societe'])->default('personne');
            $table->string('nom')->nullable();
            $table->string('nom_ar')->nullable();
            $table->string('prenom')->nullable();
            $table->string('prenom_ar')->nullable();
            $table->string('raison_sociale')->nullable();

            // Infos civiles / entreprise
            $table->date('date_naissance')->nullable();
            $table->string('lieu_naissance')->nullable();
            $table->date('date_creation_entreprise')->nullable();
            $table->string('nationalite')->nullable();
            $table->string('situation_familiale')->nullable();
            $table->unsignedTinyInteger('nb_personnes_foyer')->nullable();
            $table->string('cin')->nullable();
            $table->string('rc')->nullable();
            $table->string('ice')->nullable();
            $table->string('ifiscale')->nullable();

            // Adresses
            $table->text('adresse_bien_loue')->nullable();
            $table->text('adresse_actuelle')->nullable();
            $table->text('adresse_ar')->nullable();

            // Contact
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();

            // Activite / emploi
            $table->string('profession_activite')->nullable();
            $table->string('employeur_denomination')->nullable();
            $table->text('employeur_adresse')->nullable();
            $table->string('type_contrat')->nullable();
            $table->decimal('revenu_mensuel_net', 12, 2)->nullable();
            $table->decimal('chiffre_affaires_dernier_ex', 15, 2)->nullable();
            $table->integer('exercice_annee')->nullable();
            $table->integer('anciennete_mois')->nullable();

            // Historique locatif
            $table->text('references_locatives')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locataires', function (Blueprint $table) {
            $table->dropColumn([
                'type_personne',
                'nom',
                'nom_ar',
                'prenom',
                'prenom_ar',
                'raison_sociale',
                'date_naissance',
                'lieu_naissance',
                'date_creation_entreprise',
                'nationalite',
                'situation_familiale',
                'nb_personnes_foyer',
                'cin',
                'rc',
                'ice',
                'ifiscale',
                'adresse_bien_loue',
                'adresse_actuelle',
                'adresse_ar',
                'telephone',
                'email',
                'profession_activite',
                'employeur_denomination',
                'employeur_adresse',
                'type_contrat',
                'revenu_mensuel_net',
                'chiffre_affaires_dernier_ex',
                'exercice_annee',
                'anciennete_mois',
                'references_locatives',
            ]);
        });
    }
};
