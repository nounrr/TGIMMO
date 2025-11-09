<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bail N° {{ $bail->numero_bail }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        .header h1 {
            color: #2563eb;
            font-size: 24pt;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 10pt;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background-color: #f0f4ff;
            color: #2563eb;
            padding: 10px 15px;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            border-left: 5px solid #2563eb;
        }
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            width: 40%;
            padding: 8px;
            font-weight: bold;
            color: #555;
            background-color: #f8f9fa;
            border: 1px solid #e0e0e0;
        }
        .info-value {
            display: table-cell;
            padding: 8px;
            border: 1px solid #e0e0e0;
        }
        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-actif {
            background-color: #d1fae5;
            color: #065f46;
        }
        .badge-en_attente {
            background-color: #fef3c7;
            color: #92400e;
        }
        .badge-resilie {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 9pt;
            color: #666;
        }
        .clause-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
        }
        .observations-box {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 15px;
            margin: 15px 0;
        }
        .equipements {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        .equipement-item {
            background-color: #e0e7ff;
            color: #4338ca;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRAT DE BAIL</h1>
        <p>N° {{ $bail->numero_bail }}</p>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

    <!-- Informations générales -->
    <div class="section">
        <div class="section-title">Informations générales</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Numéro de bail</div>
                <div class="info-value">{{ $bail->numero_bail }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date de début</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($bail->date_debut)->format('d/m/Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date de fin</div>
                <div class="info-value">{{ $bail->date_fin ? \Carbon\Carbon::parse($bail->date_fin)->format('d/m/Y') : 'Non spécifiée' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Durée</div>
                <div class="info-value">{{ $bail->duree ? $bail->duree . ' mois' : 'Non spécifiée' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Statut</div>
                <div class="info-value">
                    <span class="badge badge-{{ $bail->statut }}">{{ ucfirst(str_replace('_', ' ', $bail->statut)) }}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Renouvellement automatique</div>
                <div class="info-value">{{ $bail->renouvellement_auto ? 'Oui' : 'Non' }}</div>
            </div>
        </div>
    </div>

    <!-- Locataire -->
    <div class="section">
        <div class="section-title">Locataire</div>
        <div class="info-grid">
            @if($bail->locataire->type === 'personne')
                <div class="info-row">
                    <div class="info-label">Nom complet</div>
                    <div class="info-value">{{ $bail->locataire->nom }} {{ $bail->locataire->prenom }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">CIN</div>
                    <div class="info-value">{{ $bail->locataire->cin ?? 'Non spécifié' }}</div>
                </div>
            @else
                <div class="info-row">
                    <div class="info-label">Raison sociale</div>
                    <div class="info-value">{{ $bail->locataire->raison_sociale }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">RC</div>
                    <div class="info-value">{{ $bail->locataire->rc ?? 'Non spécifié' }}</div>
                </div>
            @endif
            <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">{{ $bail->locataire->email ?? 'Non spécifié' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $bail->locataire->telephone ?? 'Non spécifié' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Adresse</div>
                <div class="info-value">{{ $bail->locataire->adresse ?? 'Non spécifiée' }}</div>
            </div>
        </div>
    </div>

    <!-- Unité -->
    <div class="section">
        <div class="section-title">Unité locative</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Numéro d'unité</div>
                <div class="info-value">{{ $bail->unite->numero_unite }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Type</div>
                <div class="info-value">{{ ucfirst(str_replace('_', ' ', $bail->unite->type_unite)) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Adresse complète</div>
                <div class="info-value">{{ $bail->unite->adresse_complete }}</div>
            </div>
            @if($bail->unite->immeuble)
            <div class="info-row">
                <div class="info-label">Immeuble</div>
                <div class="info-value">{{ $bail->unite->immeuble }}</div>
            </div>
            @endif
            @if($bail->unite->bloc)
            <div class="info-row">
                <div class="info-label">Bloc</div>
                <div class="info-value">{{ $bail->unite->bloc }}</div>
            </div>
            @endif
            @if($bail->unite->etage)
            <div class="info-row">
                <div class="info-label">Étage</div>
                <div class="info-value">{{ $bail->unite->etage }}</div>
            </div>
            @endif
            <div class="info-row">
                <div class="info-label">Superficie</div>
                <div class="info-value">{{ $bail->unite->superficie_m2 ? number_format($bail->unite->superficie_m2, 2) . ' m²' : 'Non spécifiée' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Nombre de pièces</div>
                <div class="info-value">{{ $bail->unite->nb_pieces ?? 'Non spécifié' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Salles de bain</div>
                <div class="info-value">{{ $bail->unite->nb_sdb ?? 'Non spécifié' }}</div>
            </div>
            @if($bail->unite->equipements)
            <div class="info-row">
                <div class="info-label">Équipements</div>
                <div class="info-value">
                    <div class="equipements">
                        @foreach(explode(',', $bail->unite->equipements) as $equip)
                            <span class="equipement-item">{{ trim($equip) }}</span>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif
        </div>
    </div>

    <!-- Aspects financiers -->
    <div class="section">
        <div class="section-title">Aspects financiers</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Montant du loyer</div>
                <div class="info-value"><strong>{{ number_format($bail->montant_loyer, 2) }} MAD</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Charges</div>
                <div class="info-value">{{ number_format($bail->charges ?? 0, 2) }} MAD</div>
            </div>
            <div class="info-row">
                <div class="info-label">Loyer total</div>
                <div class="info-value"><strong>{{ number_format(($bail->montant_loyer + ($bail->charges ?? 0)), 2) }} MAD</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Dépôt de garantie</div>
                <div class="info-value">{{ number_format($bail->depot_garantie ?? 0, 2) }} MAD</div>
            </div>
            <div class="info-row">
                <div class="info-label">Mode de paiement</div>
                <div class="info-value">{{ ucfirst($bail->mode_paiement) }}</div>
            </div>
        </div>
    </div>

    <!-- Clauses particulières -->
    @if($bail->clause_particuliere)
    <div class="section">
        <div class="section-title">Clauses particulières</div>
        <div class="clause-box">
            {!! nl2br(e($bail->clause_particuliere)) !!}
        </div>
    </div>
    @endif

    <!-- Observations -->
    @if($bail->observations)
    <div class="section">
        <div class="section-title">Observations</div>
        <div class="observations-box">
            {!! nl2br(e($bail->observations)) !!}
        </div>
    </div>
    @endif

    <div class="footer">
        <p>Document généré automatiquement par le système de gestion immobilière</p>
        <p>{{ now()->format('d/m/Y à H:i') }}</p>
    </div>
</body>
</html>
