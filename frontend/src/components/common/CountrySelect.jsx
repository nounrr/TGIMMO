import { useState, useMemo, useRef, useEffect } from 'react';

const COUNTRIES = [
  'Maroc',
  'Afghanistan',
  'Afrique du Sud',
  'Albanie',
  'Algérie',
  'Allemagne',
  'Andorre',
  'Angola',
  'Arabie Saoudite',
  'Argentine',
  'Arménie',
  'Australie',
  'Autriche',
  'Azerbaïdjan',
  'Bahamas',
  'Bahreïn',
  'Bangladesh',
  'Barbade',
  'Belgique',
  'Belize',
  'Bénin',
  'Bhoutan',
  'Biélorussie',
  'Birmanie',
  'Bolivie',
  'Bosnie-Herzégovine',
  'Botswana',
  'Brésil',
  'Brunei',
  'Bulgarie',
  'Burkina Faso',
  'Burundi',
  'Cambodge',
  'Cameroun',
  'Canada',
  'Cap-Vert',
  'Chili',
  'Chine',
  'Chypre',
  'Colombie',
  'Comores',
  'Congo',
  'Corée du Nord',
  'Corée du Sud',
  'Costa Rica',
  'Côte d\'Ivoire',
  'Croatie',
  'Cuba',
  'Danemark',
  'Djibouti',
  'Dominique',
  'Égypte',
  'Émirats Arabes Unis',
  'Équateur',
  'Érythrée',
  'Espagne',
  'Estonie',
  'Eswatini',
  'États-Unis',
  'Éthiopie',
  'Fidji',
  'Finlande',
  'France',
  'Gabon',
  'Gambie',
  'Géorgie',
  'Ghana',
  'Grèce',
  'Grenade',
  'Guatemala',
  'Guinée',
  'Guinée-Bissau',
  'Guinée Équatoriale',
  'Guyana',
  'Haïti',
  'Honduras',
  'Hongrie',
  'Inde',
  'Indonésie',
  'Irak',
  'Iran',
  'Irlande',
  'Islande',
  'Israël',
  'Italie',
  'Jamaïque',
  'Japon',
  'Jordanie',
  'Kazakhstan',
  'Kenya',
  'Kirghizistan',
  'Kiribati',
  'Kosovo',
  'Koweït',
  'Laos',
  'Lesotho',
  'Lettonie',
  'Liban',
  'Liberia',
  'Libye',
  'Liechtenstein',
  'Lituanie',
  'Luxembourg',
  'Macédoine du Nord',
  'Madagascar',
  'Malaisie',
  'Malawi',
  'Maldives',
  'Mali',
  'Malte',
  'Marshall',
  'Maurice',
  'Mauritanie',
  'Mexique',
  'Micronésie',
  'Moldavie',
  'Monaco',
  'Mongolie',
  'Monténégro',
  'Mozambique',
  'Namibie',
  'Nauru',
  'Népal',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'Norvège',
  'Nouvelle-Zélande',
  'Oman',
  'Ouganda',
  'Ouzbékistan',
  'Pakistan',
  'Palaos',
  'Palestine',
  'Panama',
  'Papouasie-Nouvelle-Guinée',
  'Paraguay',
  'Pays-Bas',
  'Pérou',
  'Philippines',
  'Pologne',
  'Portugal',
  'Qatar',
  'République Centrafricaine',
  'République Démocratique du Congo',
  'République Dominicaine',
  'République Tchèque',
  'Roumanie',
  'Royaume-Uni',
  'Russie',
  'Rwanda',
  'Saint-Kitts-et-Nevis',
  'Saint-Vincent-et-les-Grenadines',
  'Sainte-Lucie',
  'Salomon',
  'Salvador',
  'Samoa',
  'Sao Tomé-et-Principe',
  'Sénégal',
  'Serbie',
  'Seychelles',
  'Sierra Leone',
  'Singapour',
  'Slovaquie',
  'Slovénie',
  'Somalie',
  'Soudan',
  'Soudan du Sud',
  'Sri Lanka',
  'Suède',
  'Suisse',
  'Suriname',
  'Syrie',
  'Tadjikistan',
  'Tanzanie',
  'Tchad',
  'Thaïlande',
  'Timor Oriental',
  'Togo',
  'Tonga',
  'Trinité-et-Tobago',
  'Tunisie',
  'Turkménistan',
  'Turquie',
  'Tuvalu',
  'Ukraine',
  'Uruguay',
  'Vanuatu',
  'Vatican',
  'Venezuela',
  'Vietnam',
  'Yémen',
  'Zambie',
  'Zimbabwe',
];

export default function CountrySelect({ value, onChange, name, id, className, placeholder = "Sélectionnez un pays" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus sur l'input de recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filtrer les pays selon la recherche
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return COUNTRIES;
    return COUNTRIES.filter(country =>
      country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSelect = (country) => {
    onChange({ target: { name, value: country } });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <div
        className={className}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: value ? 'inherit' : '#94a3b8' }}>
          {value || placeholder}
        </span>
        <svg
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
        </svg>
      </div>

      {isOpen && (
        <div
          className="position-absolute w-100 mt-1 bg-white border-0 shadow-lg rounded-3"
          style={{
            zIndex: 1050,
            maxHeight: '320px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Barre de recherche */}
          <div className="p-2 border-bottom">
            <div className="position-relative">
              <svg
                className="position-absolute top-50 translate-middle-y ms-2"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                style={{ left: '4px', opacity: 0.5 }}
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control form-control-sm ps-4 border-0 shadow-sm"
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                }}
              />
            </div>
          </div>

          {/* Liste des pays */}
          <div style={{ overflowY: 'auto', maxHeight: '260px' }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country}
                  className="px-3 py-2"
                  onClick={() => handleSelect(country)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: value === country ? '#e0e7ff' : 'transparent',
                    color: value === country ? '#4338ca' : '#1e293b',
                    fontWeight: value === country ? '600' : '400',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== country) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== country) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {country === 'Maroc' && (
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                      className="me-2"
                      style={{ marginTop: '-2px', color: '#10b981' }}
                    >
                      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                    </svg>
                  )}
                  {country}
                  {value === country && (
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                      className="float-end"
                      style={{ marginTop: '2px', color: '#4338ca' }}
                    >
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted">
                <svg
                  width="40"
                  height="40"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="mb-2"
                  style={{ opacity: 0.3 }}
                >
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
                <div className="small">Aucun pays trouvé</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
