export type Field = [string, string, string, string?]
export const sections: { id: string; title: string; titleAr: string; fields: Field[] }[] = [
  { id: 'identity', title: 'Identité et coordonnées', titleAr: 'الهوية ومعلومات الاتصال', fields: [
    ['first_name', 'Prénom', 'الاسم الشخصي بالفرنسية'], ['last_name', 'Nom', 'النسب بالفرنسية'],
    ['first_name_ar', 'Prénom (Ar)', 'الاسم الشخصي بالعربية'], ['last_name_ar', 'Nom (Ar)', 'النسب بالعربية'],
    ['phone', 'Téléphone personnel', 'رقم الهاتف الشخصي', 'tel'], ['birth_date', 'Date de naissance', 'تاريخ الازدياد', 'date'],
    ['birth_city', 'Lieu de naissance (Fr)', 'مكان الازدياد بالفرنسية'], ['birth_city_ar', 'Lieu de naissance (Ar)', 'مكان الازدياد بالعربية'],
    ['nationality', 'Nationalité (Fr)', 'الجنسية بالفرنسية'], ['nationality_ar', 'Nationalité (Ar)', 'الجنسية بالعربية'],
  ] },
  { id: 'residence', title: 'Résidence et rattachement géographique', titleAr: 'السكن والمعلومات الجغرافية', fields: [
    ['country', 'Pays de résidence', 'بلد الإقامة'], ['region', 'Région', 'الجهة'], ['province', 'Province', 'الإقليم'], ['delegation', 'Délégation', 'المندوبية'],
    ['city', 'Ville', 'المدينة'], ['address', 'Adresse de résidence (Fr)', 'عنوان السكن بالفرنسية'], ['address_ar', 'Adresse de résidence (Ar)', 'عنوان السكن بالعربية'],
  ] },
  ...(['father', 'mother'] as const).map(parent => ({ id: parent, title: parent === 'father' ? 'Informations du père' : 'Informations de la mère', titleAr: parent === 'father' ? 'معلومات الأب' : 'معلومات الأم', fields: [
    [`${parent}_last_name`, 'Nom (Fr)', 'النسب بالفرنسية'], [`${parent}_first_name`, 'Prénom (Fr)', 'الاسم الشخصي بالفرنسية'],
    [`${parent}_last_name_ar`, 'Nom (Ar)', 'النسب بالعربية'], [`${parent}_first_name_ar`, 'Prénom (Ar)', 'الاسم الشخصي بالعربية'],
    [`${parent}_cin`, 'CNIE', 'رقم البطاقة الوطنية'], [`${parent}_profession`, 'Profession', 'المهنة'], [`${parent}_phone`, 'Téléphone', 'الهاتف', 'tel'],
  ] as Field[] })),
  { id: 'emergency', title: 'Parent, tuteur ou contact d’urgence', titleAr: 'الولي أو جهة الاتصال عند الطوارئ', fields: [
    ['emergency_contact_name', 'Nom du contact d’urgence', 'اسم جهة الاتصال عند الطوارئ'], ['emergency_contact_phone', 'Téléphone d’urgence', 'هاتف الطوارئ', 'tel'],
  ] },
  { id: 'bac', title: 'Baccalauréat et établissement d’origine', titleAr: 'البكالوريا ومؤسسة الدراسة', fields: [
    ['bac_series', 'Série du bac', 'شعبة البكالوريا'], ['bac_mention', 'Mention du bac', 'ميزة البكالوريا'],
    ['bac_average', 'Moyenne du bac /20', 'المعدل العام للبكالوريا', 'number'], ['bac_year', 'Année du bac', 'سنة البكالوريا', 'number'],
    ['high_school', 'Établissement du bac', 'مؤسسة البكالوريا'], ['academy', 'Académie', 'الأكاديمية'],
  ] },
  { id: 'higher', title: 'Historique de l’enseignement supérieur', titleAr: 'مسار التعليم العالي', fields: [
    ['first_higher_education_year', 'Première inscription à l’enseignement supérieur (année)', 'سنة أول تسجيل بالتعليم العالي', 'number'],
    ['first_university_enrollment_year', 'Première inscription dans une université (année)', 'سنة أول تسجيل بالجامعة', 'number'],
    ['previous_university', 'Ancienne université', 'الجامعة السابقة'], ['previous_institution', 'Ancien établissement supérieur', 'المؤسسة السابقة للتعليم العالي'],
    ['previous_degree', 'Diplôme antérieur obtenu', 'الدبلوم السابق المحصل عليه'],
  ] },
]

export const candidateProfileLabels: Record<string, string> = Object.fromEntries(sections.flatMap(section => section.fields.map(([key, label]) => [key, ['father', 'mother'].includes(section.id) ? `${label} — ${section.id === 'father' ? 'père' : 'mère'}` : label])))


export const candidateProfileLabelsAr: Record<string, string> = Object.fromEntries(sections.flatMap(section => section.fields.map(([key, , label]) => [key, label])))
