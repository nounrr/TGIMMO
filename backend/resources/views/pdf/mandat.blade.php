<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Mandat de Gestion</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            font-weight: bold;
            font-size: 16pt;
            margin-bottom: 20px;
        }
        .section-title {
            color: #1F4788;
            font-weight: bold;
            font-size: 13pt;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .sub-header {
            font-weight: bold;
            font-size: 11pt;
            margin-top: 10px;
            margin-bottom: 5px;
        }
        .content {
            text-align: justify;
            margin-bottom: 10px;
        }
        .center {
            text-align: center;
        }
        .bold {
            font-weight: bold;
        }
        table {
            width: 100%;
            margin-top: 20px;
        }
        td {
            vertical-align: top;
        }
        .signature-box {
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="header">MANDAT DE GESTION</div>

    @if($mandat->reference)
        <div class="center bold" style="font-size: 13pt; color: #1F4788; margin-bottom: 20px;">
            Référence : {{ $mandat->reference }}
        </div>
    @endif

    <div class="section-title">I. IDENTIFICATION DU PROPRIÉTAIRE</div>
    
    @php
        $proprietaire = $mandat->proprietaires->isNotEmpty() ? $mandat->proprietaires->first() : null;
    @endphp

    @if($proprietaire)
        @php
            $isSociete = !empty($proprietaire->rc) || !empty($proprietaire->ice) || $proprietaire->type_proprietaire === 'societe';
        @endphp

        @if($isSociete)
            <div>Raison sociale : {{ $proprietaire->nom_raison }}</div>
            @if($proprietaire->rc)
                <div>RC : {{ $proprietaire->rc }}</div>
            @endif
            @if($proprietaire->ice)
                <div>ICE : {{ $proprietaire->ice }}</div>
            @endif
            @if($proprietaire->ifiscale)
                <div>IF : {{ $proprietaire->ifiscale }}</div>
            @endif
        @else
            <div>Nom complet : {{ $proprietaire->nom_raison }}</div>
            @if($proprietaire->cin)
                <div>CIN : {{ $proprietaire->cin }}</div>
            @endif
        @endif

        @if($proprietaire->adresse_complete)
            <div>Adresse : {{ $proprietaire->adresse_complete }}</div>
        @endif
        @if($proprietaire->ville)
            <div>Ville : {{ $proprietaire->ville }}</div>
        @endif
        @if($proprietaire->telephone)
            <div>Téléphone : {{ $proprietaire->telephone }}</div>
        @endif
        @if($proprietaire->email)
            <div>Email : {{ $proprietaire->email }}</div>
        @endif
    @else
        <div>Aucun propriétaire identifié.</div>
    @endif

    <div class="section-title">II. DURÉE DU MANDAT</div>
    <div>Date de début : {{ date('d/m/Y', strtotime($mandat->date_debut)) }}</div>
    @if($mandat->date_fin)
        <div>Date de fin : {{ date('d/m/Y', strtotime($mandat->date_fin)) }}</div>
    @endif

    <div class="section-title">III. HONORAIRES DE GESTION</div>
    @if($mandat->taux_gestion_pct)
        <div>Taux de gestion : {{ $mandat->taux_gestion_pct }} %</div>
    @endif
    <div>Assiette des honoraires : {{ ucfirst(str_replace('_', ' ', $mandat->assiette_honoraires)) }}</div>
    
    @if($mandat->frais_min_mensuel)
        <div>Frais minimum mensuel : {{ number_format($mandat->frais_min_mensuel, 2) }} MAD</div>
    @endif
    
    @if($mandat->tva_applicable)
        <div>TVA applicable : Oui ({{ $mandat->tva_taux ?: '20' }} %)</div>
    @endif
    
    @if($mandat->periodicite_releve)
        <div>Périodicité des relevés : {{ ucfirst($mandat->periodicite_releve) }}</div>
    @endif

    @if($mandat->description_bien)
        <div class="section-title">IV. DESCRIPTION DU BIEN</div>
        <div class="content">{{ $mandat->description_bien }}</div>
        @if($mandat->usage_bien)
            <div>Usage : {{ ucfirst($mandat->usage_bien) }}</div>
        @endif
    @endif

    @if($mandat->pouvoirs_accordes)
        <div class="section-title">V. POUVOIRS ACCORDÉS AU GESTIONNAIRE</div>
        <div class="content">{{ $mandat->pouvoirs_accordes }}</div>
    @endif

    <div class="section-title">VI. AUTRES DISPOSITIONS</div>
    @if($mandat->charge_maintenance)
        <div>Charge de maintenance : {{ ucfirst(str_replace('_', ' ', $mandat->charge_maintenance)) }}</div>
    @endif
    @if($mandat->mode_versement)
        <div>Mode de versement : {{ ucfirst($mandat->mode_versement) }}</div>
    @endif

    @if($mandat->notes_clauses)
        <div class="sub-header">Notes et clauses particulières :</div>
        <div class="content">{{ $mandat->notes_clauses }}</div>
    @endif

    <div class="section-title">SIGNATURES</div>
    
    <table>
        <tr>
            <td width="50%">
                <div class="bold">Le Propriétaire</div>
                <br><br><br>
                <div>{{ $proprietaire ? $proprietaire->nom_raison : '' }}</div>
            </td>
            <td width="50%">
                <div class="bold">Le Gestionnaire</div>
                <br><br><br>
                <div></div>
            </td>
        </tr>
    </table>

    @if($mandat->lieu_signature || $mandat->date_signature)
        <div style="margin-top: 30px;">
            Fait à {{ $mandat->lieu_signature ?: '________________' }}, le {{ $mandat->date_signature ? date('d/m/Y', strtotime($mandat->date_signature)) : '________________' }}
        </div>
    @endif

</body>
</html>
