export interface CountryItem {
  name: string
  nameAr: string
  nationality: string
  nationalityAr: string
}

export const COUNTRIES: CountryItem[] = [
  // Priorité Maroc
  { name: 'Maroc', nameAr: 'المغرب', nationality: 'Marocaine', nationalityAr: 'مغربية' },
  // Étudiants internationaux et pays partenaires réguliers à l'ENCG
  { name: 'Sénégal', nameAr: 'السنغال', nationality: 'Sénégalaise', nationalityAr: 'سنغالية' },
  { name: 'Mali', nameAr: 'مالي', nationality: 'Malienne', nationalityAr: 'مالية' },
  { name: "Côte d'Ivoire", nameAr: 'ساحل العاج', nationality: 'Ivoirienne', nationalityAr: 'إيفوارية' },
  { name: 'Guinée', nameAr: 'غينيا', nationality: 'Guinéenne', nationalityAr: 'غينية' },
  { name: 'Mauritanie', nameAr: 'موريتانيا', nationality: 'Mauritanienne', nationalityAr: 'موريتانية' },
  { name: 'Gabon', nameAr: 'الغابون', nationality: 'Gabonaise', nationalityAr: 'غابونية' },
  { name: 'Cameroun', nameAr: 'الكاميرون', nationality: 'Camerounaise', nationalityAr: 'كاميرونية' },
  { name: 'Niger', nameAr: 'النيجر', nationality: 'Nigérienne', nationalityAr: 'نيجيرية' },
  { name: 'Tchad', nameAr: 'تشاد', nationality: 'Tchadienne', nationalityAr: 'تشادية' },
  { name: 'Burkina Faso', nameAr: 'بوركينا فاسو', nationality: 'Burkinabè', nationalityAr: 'بوركينية' },
  { name: 'Togo', nameAr: 'توغو', nationality: 'Togolaise', nationalityAr: 'توغولية' },
  { name: 'Bénin', nameAr: 'بنين', nationality: 'Béninoise', nationalityAr: 'بنينية' },
  { name: 'Congo', nameAr: 'الكونغو', nationality: 'Congolaise', nationalityAr: 'كونغولية' },
  { name: 'RD Congo', nameAr: 'جمهورية الكونغو الديمقراطية', nationality: 'Congolaise (RDC)', nationalityAr: 'كونغولية' },
  { name: 'Tunisie', nameAr: 'تونس', nationality: 'Tunisienne', nationalityAr: 'تونسية' },
  { name: 'Algérie', nameAr: 'الجزائر', nationality: 'Algérienne', nationalityAr: 'جزائرية' },
  { name: 'France', nameAr: 'فرنسا', nationality: 'Française', nationalityAr: 'فرنسية' },
  { name: 'Espagne', nameAr: 'إسبانيا', nationality: 'Espagnole', nationalityAr: 'إسبانية' },
  { name: 'Belgique', nameAr: 'بلجيكا', nationality: 'Belge', nationalityAr: 'بلجيكية' },
  { name: 'Canada', nameAr: 'كندا', nationality: 'Canadienne', nationalityAr: 'كندية' },
  { name: 'États-Unis', nameAr: 'الولايات المتحدة الأمريكية', nationality: 'Américaine', nationalityAr: 'أمريكية' },
  { name: 'Italie', nameAr: 'إيطاليا', nationality: 'Italienne', nationalityAr: 'إيطالية' },
  { name: 'Allemagne', nameAr: 'ألمانيا', nationality: 'Allemande', nationalityAr: 'ألمانية' },
  { name: 'Royaume-Uni', nameAr: 'المملكة المتحدة', nationality: 'Britannique', nationalityAr: 'بريطانية' },
  { name: 'Suisse', nameAr: 'سويسرا', nationality: 'Suisse', nationalityAr: 'سويسرية' },
  { name: 'Turquie', nameAr: 'تركيا', nationality: 'Turque', nationalityAr: 'تركية' },
  { name: 'Égypte', nameAr: 'مصر', nationality: 'Égyptienne', nationalityAr: 'مصرية' },
  { name: 'Arabie Saoudite', nameAr: 'المملكة العربية السعودية', nationality: 'Saoudienne', nationalityAr: 'سعودية' },
  { name: 'Émirats Arabes Unis', nameAr: 'الإمارات العربية المتحدة', nationality: 'Émiratie', nationalityAr: 'إماراتية' },
  { name: 'Qatar', nameAr: 'قطر', nationality: 'Qatarienne', nationalityAr: 'قطرية' },
  { name: 'Koweït', nameAr: 'الكويت', nationality: 'Koweïtienne', nationalityAr: 'كويتية' },
  { name: 'Jordanie', nameAr: 'الأردن', nationality: 'Jordanienne', nationalityAr: 'أردنية' },
  { name: 'Liban', nameAr: 'لبنان', nationality: 'Libanaise', nationalityAr: 'لبنانية' },
  { name: 'Chine', nameAr: 'الصين', nationality: 'Chinoise', nationalityAr: 'صينية' },
  { name: 'Autre', nameAr: 'دولة أخرى', nationality: 'Étrangère', nationalityAr: 'أجنبية' }
]

export interface MoroccanProvince {
  name: string
  nameAr?: string
  delegation: string
  cities: string[]
}

export interface MoroccanRegion {
  name: string
  nameAr: string
  provinces: MoroccanProvince[]
}

export const MOROCCAN_REGIONS: MoroccanRegion[] = [
  {
    name: 'Fès-Meknès',
    nameAr: 'فاس - مكناس',
    provinces: [
      { name: 'Fès', delegation: 'Direction Provinciale de Fès', cities: ['Fès'] },
      { name: 'Meknès', delegation: 'Direction Provinciale de Meknès', cities: ['Meknès', 'Ouislane', 'Toulal', 'Moulay Driss Zerhoun'] },
      { name: 'Sefrou', delegation: 'Direction Provinciale de Sefrou', cities: ['Sefrou', 'Bhalil', 'Immouzer Kandar', 'El Menzel'] },
      { name: 'Ifrane', delegation: 'Direction Provinciale d’Ifrane', cities: ['Ifrane', 'Azrou'] },
      { name: 'El Hajeb', delegation: 'Direction Provinciale d’El Hajeb', cities: ['El Hajeb', 'Agourai', 'Ain Taoujdate'] },
      { name: 'Moulay Yaâcoub', delegation: 'Direction Provinciale de Moulay Yaâcoub', cities: ['Moulay Yaâcoub', 'Ain Chkef'] },
      { name: 'Taza', delegation: 'Direction Provinciale de Taza', cities: ['Taza', 'Tahla', 'Oued Amlil', 'Aknoul'] },
      { name: 'Taounate', delegation: 'Direction Provinciale de Taounate', cities: ['Taounate', 'Karia Ba Mohamed', 'Tissa'] },
      { name: 'Boulemane', delegation: 'Direction Provinciale de Boulemane', cities: ['Missour', 'Outat El Haj', 'Boulemane'] }
    ]
  },
  {
    name: 'Casablanca-Settat',
    nameAr: 'الدار البيضاء - سطات',
    provinces: [
      { name: 'Casablanca', delegation: 'Direction Provinciale de Casablanca', cities: ['Casablanca', 'Ain Sebaa', 'Anfa', 'Hay Hassani', 'Sidi Bernoussi', 'Ben M’sik', 'Al Fida'] },
      { name: 'Mohammedia', delegation: 'Direction Provinciale de Mohammedia', cities: ['Mohammedia', 'Ain Harrouda'] },
      { name: 'Nouaceur', delegation: 'Direction Provinciale de Nouaceur', cities: ['Nouaceur', 'Bouskoura', 'Dar Bouazza'] },
      { name: 'Médiouna', delegation: 'Direction Provinciale de Médiouna', cities: ['Médiouna', 'Tit Mellil'] },
      { name: 'Berrechid', delegation: 'Direction Provinciale de Berrechid', cities: ['Berrechid', 'Deroua', 'Had Soualem'] },
      { name: 'Settat', delegation: 'Direction Provinciale de Settat', cities: ['Settat', 'Ben Ahmed'] },
      { name: 'El Jadida', delegation: 'Direction Provinciale d’El Jadida', cities: ['El Jadida', 'Azemmour', 'Sidi Bouzid'] },
      { name: 'Sidi Bennour', delegation: 'Direction Provinciale de Sidi Bennour', cities: ['Sidi Bennour', 'Zemamra'] },
      { name: 'Benslimane', delegation: 'Direction Provinciale de Benslimane', cities: ['Benslimane', 'Bouznika'] }
    ]
  },
  {
    name: 'Rabat-Salé-Kénitra',
    nameAr: 'الرباط - سلا - القنيطرة',
    provinces: [
      { name: 'Rabat', delegation: 'Direction Provinciale de Rabat', cities: ['Rabat', 'Touarga'] },
      { name: 'Salé', delegation: 'Direction Provinciale de Salé', cities: ['Salé', 'Sidi Bouknadel'] },
      { name: 'Skhirate-Témara', delegation: 'Direction Provinciale de Skhirate-Témara', cities: ['Témara', 'Skhirat', 'Harhoura'] },
      { name: 'Kénitra', delegation: 'Direction Provinciale de Kénitra', cities: ['Kénitra', 'Mehdya', 'Souk El Arbaa'] },
      { name: 'Khémisset', delegation: 'Direction Provinciale de Khémisset', cities: ['Khémisset', 'Tiflet', 'Rommani'] },
      { name: 'Sidi Kacem', delegation: 'Direction Provinciale de Sidi Kacem', cities: ['Sidi Kacem', 'Mechra Bel Ksiri'] },
      { name: 'Sidi Slimane', delegation: 'Direction Provinciale de Sidi Slimane', cities: ['Sidi Slimane', 'Sidi Yahya El Gharb'] }
    ]
  },
  {
    name: 'Tanger-Tétouan-Al Hoceïma',
    nameAr: 'طنجة - تطوان - الحسيمة',
    provinces: [
      { name: 'Tanger-Assilah', delegation: 'Direction Provinciale de Tanger-Assilah', cities: ['Tanger', 'Assilah', 'Gzenaya'] },
      { name: 'Tétouan', delegation: 'Direction Provinciale de Tétouan', cities: ['Tétouan', 'Oued Laou'] },
      { name: 'M’diq-Fnideq', delegation: 'Direction Provinciale de M’diq-Fnideq', cities: ['M’diq', 'Fnideq', 'Martil'] },
      { name: 'Larache', delegation: 'Direction Provinciale de Larache', cities: ['Larache', 'Ksar El Kébir'] },
      { name: 'Al Hoceïma', delegation: 'Direction Provinciale d’Al Hoceïma', cities: ['Al Hoceïma', 'Imzouren', 'Beni Bouayach'] },
      { name: 'Chefchaouen', delegation: 'Direction Provinciale de Chefchaouen', cities: ['Chefchaouen', 'Bab Berred'] },
      { name: 'Ouezzane', delegation: 'Direction Provinciale d’Ouezzane', cities: ['Ouezzane'] },
      { name: 'Fahs-Anjra', delegation: 'Direction Provinciale de Fahs-Anjra', cities: ['Ksar Sghir', 'Malloussa'] }
    ]
  },
  {
    name: 'Marrakech-Safi',
    nameAr: 'مراكش - آسفي',
    provinces: [
      { name: 'Marrakech', delegation: 'Direction Provinciale de Marrakech', cities: ['Marrakech', 'Tamansourt'] },
      { name: 'Safi', delegation: 'Direction Provinciale de Safi', cities: ['Safi', 'Sebt Gzoula'] },
      { name: 'Essaouira', delegation: 'Direction Provinciale d’Essaouira', cities: ['Essaouira', 'Tamanar'] },
      { name: 'El Kelâa des Sraghna', delegation: 'Direction Provinciale d’El Kelâa des Sraghna', cities: ['El Kelâa des Sraghna', 'Sidi Rahhal'] },
      { name: 'Rehamna', delegation: 'Direction Provinciale de Rehamna', cities: ['Ben Guerir', 'Sidi Bou Othmane'] },
      { name: 'Al Haouz', delegation: 'Direction Provinciale d’Al Haouz', cities: ['Tahannaout', 'Ait Ourir', 'Asni'] },
      { name: 'Chichaoua', delegation: 'Direction Provinciale de Chichaoua', cities: ['Chichaoua', 'Imintanoute'] },
      { name: 'Youssoufia', delegation: 'Direction Provinciale de Youssoufia', cities: ['Youssoufia', 'Echemaia'] }
    ]
  },
  {
    name: 'Souss-Massa',
    nameAr: 'سوس - ماسة',
    provinces: [
      { name: 'Agadir-Ida-Ou-Tanane', delegation: 'Direction Provinciale d’Agadir-Ida-Ou-Tanane', cities: ['Agadir', 'Taghazout', 'Aourir'] },
      { name: 'Inezgane-Aït Melloul', delegation: 'Direction Provinciale d’Inezgane-Aït Melloul', cities: ['Inezgane', 'Aït Melloul', 'Dcheira El Jihadia'] },
      { name: 'Chtouka-Aït Baha', delegation: 'Direction Provinciale de Chtouka-Aït Baha', cities: ['Biougra', 'Aït Baha', 'Massa'] },
      { name: 'Taroudant', delegation: 'Direction Provinciale de Taroudant', cities: ['Taroudant', 'Oulad Teïma', 'Aoulouz'] },
      { name: 'Tiznit', delegation: 'Direction Provinciale de Tiznit', cities: ['Tiznit', 'Tafraout'] },
      { name: 'Tata', delegation: 'Direction Provinciale de Tata', cities: ['Tata', 'Akka', 'Fam El Hisn'] }
    ]
  },
  {
    name: 'Oriental',
    nameAr: 'الشرق',
    provinces: [
      { name: 'Oujda-Angad', delegation: 'Direction Provinciale d’Oujda-Angad', cities: ['Oujda', 'Beni Drar', 'Naima'] },
      { name: 'Nador', delegation: 'Direction Provinciale de Nador', cities: ['Nador', 'Zaïo', 'Al Aaroui', 'Beni Ensar'] },
      { name: 'Berkane', delegation: 'Direction Provinciale de Berkane', cities: ['Berkane', 'Saïdia', 'Ahfir'] },
      { name: 'Taourirt', delegation: 'Direction Provinciale de Taourirt', cities: ['Taourirt', 'El Aioun Sidi Mellouk'] },
      { name: 'Guercif', delegation: 'Direction Provinciale de Guercif', cities: ['Guercif'] },
      { name: 'Driouch', delegation: 'Direction Provinciale de Driouch', cities: ['Driouch', 'Midar', 'Ben Taieb'] },
      { name: 'Jerada', delegation: 'Direction Provinciale de Jerada', cities: ['Jerada', 'Ain Beni Mathar', 'Touissit'] },
      { name: 'Figuig', delegation: 'Direction Provinciale de Figuig', cities: ['Bouarfa', 'Figuig'] }
    ]
  },
  {
    name: 'Béni Mellal-Khénifra',
    nameAr: 'بني ملال - خنيفرة',
    provinces: [
      { name: 'Béni Mellal', delegation: 'Direction Provinciale de Béni Mellal', cities: ['Béni Mellal', 'Kasba Tadla', 'Zaouiat Cheikh'] },
      { name: 'Fquih Ben Salah', delegation: 'Direction Provinciale de Fquih Ben Salah', cities: ['Fquih Ben Salah', 'Souk Sebt Oulad Nemma'] },
      { name: 'Khouribga', delegation: 'Direction Provinciale de Khouribga', cities: ['Khouribga', 'Oued Zem', 'Boujniba', 'Bejaad'] },
      { name: 'Khénifra', delegation: 'Direction Provinciale de Khénifra', cities: ['Khénifra', 'M’rirt'] },
      { name: 'Azilal', delegation: 'Direction Provinciale d’Azilal', cities: ['Azilal', 'Demnate'] }
    ]
  },
  {
    name: 'Drâa-Tafilalet',
    nameAr: 'درعة - تافيلالت',
    provinces: [
      { name: 'Errachidia', delegation: 'Direction Provinciale d’Errachidia', cities: ['Errachidia', 'Erfoud', 'Rissani', 'Goulmima', 'Tinjdad'] },
      { name: 'Ouarzazate', delegation: 'Direction Provinciale d’Ouarzazate', cities: ['Ouarzazate', 'Taznakht'] },
      { name: 'Midelt', delegation: 'Direction Provinciale de Midelt', cities: ['Midelt', 'Er-Rich'] },
      { name: 'Tinghir', delegation: 'Direction Provinciale de Tinghir', cities: ['Tinghir', 'Boumalne Dades', 'Kalaat M’Gouna'] },
      { name: 'Zagora', delegation: 'Direction Provinciale de Zagora', cities: ['Zagora', 'Agdz'] }
    ]
  },
  {
    name: 'Guelmim-Oued Noun',
    nameAr: 'كلميم - واد نون',
    provinces: [
      { name: 'Guelmim', delegation: 'Direction Provinciale de Guelmim', cities: ['Guelmim', 'Bouizakarne'] },
      { name: 'Tan-Tan', delegation: 'Direction Provinciale de Tan-Tan', cities: ['Tan-Tan', 'El Ouatia'] },
      { name: 'Sidi Ifni', delegation: 'Direction Provinciale de Sidi Ifni', cities: ['Sidi Ifni', 'Lakhsas'] },
      { name: 'Assa-Zag', delegation: 'Direction Provinciale d’Assa-Zag', cities: ['Assa', 'Zag'] }
    ]
  },
  {
    name: 'Laâyoune-Sakia El Hamra',
    nameAr: 'العيون - الساقية الحمراء',
    provinces: [
      { name: 'Laâyoune', delegation: 'Direction Provinciale de Laâyoune', cities: ['Laâyoune', 'El Marsa'] },
      { name: 'Boujdour', delegation: 'Direction Provinciale de Boujdour', cities: ['Boujdour'] },
      { name: 'Tarfaya', delegation: 'Direction Provinciale de Tarfaya', cities: ['Tarfaya'] },
      { name: 'Es-Semara', delegation: 'Direction Provinciale d’Es-Semara', cities: ['Es-Semara'] }
    ]
  },
  {
    name: 'Dakhla-Oued Ed-Dahab',
    nameAr: 'الداخلة - وادي الذهب',
    provinces: [
      { name: 'Oued Ed-Dahab', delegation: 'Direction Provinciale d’Oued Ed-Dahab', cities: ['Dakhla'] },
      { name: 'Aousserd', delegation: 'Direction Provinciale d’Aousserd', cities: ['Aousserd', 'Bir Gandouz'] }
    ]
  }
]

export function getProvincesForRegion(regionName: string): MoroccanProvince[] {
  const match = MOROCCAN_REGIONS.find(r => r.name.toLowerCase() === regionName.toLowerCase())
  return match ? match.provinces : []
}

export function getAllMoroccanProvinces(): MoroccanProvince[] {
  return MOROCCAN_REGIONS.flatMap(r => r.provinces)
}

export function getRegionForProvince(provinceName: string): string | null {
  const norm = provinceName.trim().toLowerCase()
  for (const reg of MOROCCAN_REGIONS) {
    if (reg.provinces.some(p => p.name.toLowerCase() === norm || norm.includes(p.name.toLowerCase()))) {
      return reg.name
    }
  }
  return null
}

export function getProvinceDetails(provinceName: string): MoroccanProvince | null {
  const norm = provinceName.trim().toLowerCase()
  for (const reg of MOROCCAN_REGIONS) {
    const match = reg.provinces.find(p => p.name.toLowerCase() === norm || norm.includes(p.name.toLowerCase()))
    if (match) return match
  }
  return null
}

export function getCountryDetails(countryName: string): CountryItem | null {
  const norm = countryName.trim().toLowerCase()
  return COUNTRIES.find(c => c.name.toLowerCase() === norm || c.nameAr === countryName.trim()) || null
}
