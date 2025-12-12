/**
 * Vérifie si une franchise est active pour une date donnée
 * @param {Object} franchise - Objet franchise avec date_debut et date_fin
 * @param {string|Date} date - Date à vérifier (défaut: aujourd'hui)
 * @returns {boolean}
 */
export function isFranchiseActive(franchise, date = new Date()) {
  if (!franchise || !franchise.date_debut || !franchise.date_fin) return false;
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const debut = new Date(franchise.date_debut);
  const fin = new Date(franchise.date_fin);
  debut.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  
  return checkDate >= debut && checkDate <= fin;
}

/**
 * Récupère la franchise active pour une date donnée parmi une liste de franchises
 * @param {Array} franchises - Liste des franchises
 * @param {string|Date} date - Date à vérifier (défaut: aujourd'hui)
 * @returns {Object|null}
 */
export function getActiveFranchise(franchises = [], date = new Date()) {
  if (!franchises || franchises.length === 0) return null;
  return franchises.find(f => isFranchiseActive(f, date)) || null;
}

/**
 * Calcule le montant après application d'une remise en pourcentage
 * @param {number} montant - Montant original
 * @param {number} pourcentageRemise - Pourcentage de remise (0-100)
 * @returns {number}
 */
export function appliquerRemise(montant, pourcentageRemise) {
  const m = parseFloat(montant) || 0;
  const p = parseFloat(pourcentageRemise) || 0;
  return m * (1 - p / 100);
}

/**
 * Calcule le loyer avec franchise applicable
 * @param {Object} bail - Objet bail avec montant_loyer et franchises
 * @param {string|Date} date - Date à vérifier (défaut: aujourd'hui)
 * @returns {Object} { loyerNormal, loyerAvecFranchise, franchiseActive, pourcentageRemise }
 */
export function calculerLoyerAvecFranchise(bail, date = new Date()) {
  const loyerNormal = parseFloat(bail?.montant_loyer || bail?.loyer_total || 0);
  
  if (!bail?.franchises || bail.franchises.length === 0) {
    return {
      loyerNormal,
      loyerAvecFranchise: loyerNormal,
      franchiseActive: null,
      pourcentageRemise: 0,
    };
  }

  const franchiseActive = getActiveFranchise(bail.franchises, date);
  
  if (!franchiseActive) {
    return {
      loyerNormal,
      loyerAvecFranchise: loyerNormal,
      franchiseActive: null,
      pourcentageRemise: 0,
    };
  }

  const pourcentageRemise = parseFloat(franchiseActive.pourcentage_remise) || 0;
  const loyerAvecFranchise = appliquerRemise(loyerNormal, pourcentageRemise);

  return {
    loyerNormal,
    loyerAvecFranchise,
    franchiseActive,
    pourcentageRemise,
  };
}

/**
 * Formate un montant en devise marocaine
 * @param {number} montant
 * @returns {string}
 */
export function formatMontant(montant) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant) + ' MAD';
}

/**
 * Vérifie si deux périodes se chevauchent
 * @param {string|Date} debut1 
 * @param {string|Date} fin1 
 * @param {string|Date} debut2 
 * @param {string|Date} fin2 
 * @returns {boolean}
 */
export function periodesSeOverlap(debut1, fin1, debut2, fin2) {
  const d1 = new Date(debut1);
  const f1 = new Date(fin1);
  const d2 = new Date(debut2);
  const f2 = new Date(fin2);
  
  d1.setHours(0, 0, 0, 0);
  f1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  f2.setHours(0, 0, 0, 0);
  
  return d1 <= f2 && f1 >= d2;
}

/**
 * Détecte les chevauchements dans une liste de franchises
 * @param {Array} franchises - Liste des franchises avec date_debut et date_fin
 * @returns {Array} Liste des paires de franchises qui se chevauchent
 */
export function detecterChevauchements(franchises = []) {
  const chevauchements = [];
  
  for (let i = 0; i < franchises.length; i++) {
    for (let j = i + 1; j < franchises.length; j++) {
      if (periodesSeOverlap(
        franchises[i].date_debut,
        franchises[i].date_fin,
        franchises[j].date_debut,
        franchises[j].date_fin
      )) {
        chevauchements.push([franchises[i], franchises[j]]);
      }
    }
  }
  
  return chevauchements;
}
