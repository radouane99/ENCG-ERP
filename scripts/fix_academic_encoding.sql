-- ==============================================================================
-- ENCG ERP - Correctif Global des Encodages UTF-8 (Arabe & Accents Français)
-- ==============================================================================

-- 1. Filières
UPDATE filieres SET name = 'Management Commercial et Marketing', name_ar = 'التدبير التجاري والتسويق' WHERE code = 'MCM';
UPDATE filieres SET name = 'Audit & Conseil Juridique des Affaires', name_ar = 'التدقيق والاستشارة القانونية للأعمال' WHERE code = 'ACDA';
UPDATE filieres SET name = 'Management des Systèmes d''Information', name_ar = 'تدبير نظم المعلومات' WHERE code = 'MSI';
UPDATE filieres SET name = 'Tronc Commun', name_ar = 'الجذع المشترك' WHERE code = 'TC';
UPDATE filieres SET name = 'Gestion Financière et Comptable', name_ar = 'التسيير المالي والمحاسباتي' WHERE code = 'GFC';
UPDATE filieres SET name = 'Commerce International', name_ar = 'التجارة الدولية' WHERE code = 'CI';

-- 2. Départements
UPDATE departments SET name = 'Économie Appliquée', name_ar = 'الاقتصاد التطبيقي' WHERE code = 'EA';
UPDATE departments SET name = 'Sciences de Gestion', name_ar = 'علوم التدبير' WHERE code = 'SG';
UPDATE departments SET name = 'Droit des Affaires', name_ar = 'قانون الأعمال' WHERE code = 'DA';
UPDATE departments SET name = 'Langues et Communication', name_ar = 'اللغات والتواصل' WHERE code = 'LC';
UPDATE departments SET name = 'Informatique de Gestion', name_ar = 'معلوميات التدبير' WHERE code = 'IG';

-- 3. Modules (Accents Français + Noms en Arabe)
UPDATE modules SET name = 'Mathématiques pour la Gestion', name_ar = 'الرياضيات للتسيير' WHERE id = 1;
UPDATE modules SET name = 'Comptabilité Générale I', name_ar = 'المحاسبة العامة 1' WHERE id = 2;
UPDATE modules SET name = 'Économie Générale I', name_ar = 'الاقتصاد العام 1' WHERE id = 3;
UPDATE modules SET name = 'Langue Anglaise I', name_ar = 'اللغة الإنجليزية 1' WHERE id = 4;
UPDATE modules SET name = 'Management de Base', name_ar = 'أساسيات التدبير' WHERE id = 5;
UPDATE modules SET name = 'Informatique de Gestion I', name_ar = 'معلوميات التدبير 1' WHERE id = 6;
UPDATE modules SET name = 'Soft Skills I', name_ar = 'المهارات الذاتية 1' WHERE id = 7;
UPDATE modules SET name = 'Statistiques et Probabilités', name_ar = 'الإحصاء والاحتمالات' WHERE id = 8;
UPDATE modules SET name = 'Comptabilité Générale II', name_ar = 'المحاسبة العامة 2' WHERE id = 9;
UPDATE modules SET name = 'Économie Générale II', name_ar = 'الاقتصاد العام 2' WHERE id = 10;
UPDATE modules SET name = 'Langue Anglaise II', name_ar = 'اللغة الإنجليزية 2' WHERE id = 11;
UPDATE modules SET name = 'Marketing de Base', name_ar = 'أساسيات التسويق' WHERE id = 12;
UPDATE modules SET name = 'Informatique de Gestion II', name_ar = 'معلوميات التدبير 2' WHERE id = 13;
UPDATE modules SET name = 'Soft Skills II', name_ar = 'المهارات الذاتية 2' WHERE id = 14;
UPDATE modules SET name = 'Comptabilité Approfondie', name_ar = 'المحاسبة المعمقة' WHERE id = 15;
UPDATE modules SET name = 'Analyse Financière', name_ar = 'التحليل المالي' WHERE id = 16;
UPDATE modules SET name = 'Finance d''Entreprise', name_ar = 'مالية المقاولة' WHERE id = 17;
UPDATE modules SET name = 'Fiscalité des Entreprises', name_ar = 'جبايات المقاولات' WHERE id = 18;
UPDATE modules SET name = 'Droit des Sociétés', name_ar = 'قانون الشركات' WHERE id = 19;
UPDATE modules SET name = 'Management Stratégique', name_ar = 'التدبير الاستراتيجي' WHERE id = 20;
UPDATE modules SET name = 'Anglais des Affaires', name_ar = 'إنجليزية الأعمال' WHERE id = 21;
UPDATE modules SET name = 'Comportement du Consommateur', name_ar = 'سلوك المستهلك' WHERE id = 22;
UPDATE modules SET name = 'Marketing Stratégique', name_ar = 'التسويق الاستراتيجي' WHERE id = 23;
UPDATE modules SET name = 'Études de Marché', name_ar = 'دراسات السوق' WHERE id = 24;
UPDATE modules SET name = 'Communication Commerciale', name_ar = 'التواصل التجاري' WHERE id = 25;
UPDATE modules SET name = 'Management de la Force de Vente', name_ar = 'تدبير فريق المبيعات' WHERE id = 26;
UPDATE modules SET name = 'Droit Commercial', name_ar = 'القانون التجاري' WHERE id = 27;
UPDATE modules SET name = 'Anglais du Marketing', name_ar = 'إنجليزية التسويق' WHERE id = 28;

-- 4. Professeurs (Spécialités corrigées + Noms en Arabe)
UPDATE professors SET specialty = 'Finance & Contrôle de Gestion', first_name_ar = 'عبد الحق', last_name_ar = 'العمراني' WHERE id = 6;
UPDATE professors SET specialty = 'Marketing & Stratégie', first_name_ar = 'سارة', last_name_ar = 'بنموسى' WHERE id = 7;
UPDATE professors SET specialty = 'Comptabilité Approfondie', first_name_ar = 'يوسف', last_name_ar = 'الشرايبي' WHERE id = 8;
UPDATE professors SET specialty = 'Économétrie & Macroéconomie', first_name_ar = 'محمد', last_name_ar = 'بنجلون' WHERE id = 9;
UPDATE professors SET specialty = 'Commerce International', first_name_ar = 'أمينة', last_name_ar = 'التازي' WHERE id = 10;
UPDATE professors SET specialty = 'Droit des Affaires & Fiscalité', first_name_ar = 'فاطمة الزهراء', last_name_ar = 'العلمي' WHERE id = 11;
UPDATE professors SET specialty = 'Droit Commercial', first_name_ar = 'حسن', last_name_ar = 'الفيلالي' WHERE id = 12;
UPDATE professors SET specialty = 'Communication d''Entreprise & TEC', first_name_ar = 'كريم', last_name_ar = 'الإدريسي' WHERE id = 13;
UPDATE professors SET specialty = 'Business English', first_name_ar = 'ليلى', last_name_ar = 'برادة' WHERE id = 14;
UPDATE professors SET specialty = 'Systèmes d''Information & ERP', first_name_ar = 'نادية', last_name_ar = 'التازي' WHERE id = 15;
UPDATE professors SET specialty = 'Data Analytics & Informatique', first_name_ar = 'رشيد', last_name_ar = 'المنصوري' WHERE id = 16;
UPDATE professors SET specialty = 'Finance & Management', first_name_ar = 'محمد', last_name_ar = 'العمراني' WHERE id = 17;
UPDATE professors SET specialty = 'Finance & Management', first_name_ar = 'فاطمة', last_name_ar = 'بنسودة' WHERE id = 18;
UPDATE professors SET first_name_ar = 'أمينة', last_name_ar = 'الشرايبي' WHERE id = 2;
UPDATE professors SET first_name_ar = 'طارق', last_name_ar = 'مزيان' WHERE id = 3;
UPDATE professors SET first_name_ar = 'كريم', last_name_ar = 'العلمي' WHERE id = 1;
UPDATE professors SET first_name_ar = 'بشرى', last_name_ar = 'بناني' WHERE id = 4;
UPDATE professors SET first_name_ar = 'محمد', last_name_ar = 'بنجلون' WHERE id = 5;

-- 5. Utilisateurs Professeurs (name_ar)
UPDATE users SET name_ar = 'أمينة الشرايبي' WHERE id = 31;
UPDATE users SET name_ar = 'طارق مزيان' WHERE id = 32;
UPDATE users SET name_ar = 'أ.د. كريم العلمي' WHERE id = 30;
UPDATE users SET name_ar = 'بشرى بناني' WHERE id = 33;
UPDATE users SET name_ar = 'محمد بنجلون' WHERE id = 34;
UPDATE users SET name_ar = 'عبد الحق العمراني' WHERE id = 107;
UPDATE users SET name_ar = 'سارة بنموسى' WHERE id = 108;
UPDATE users SET name_ar = 'يوسف الشرايبي' WHERE id = 109;
UPDATE users SET name_ar = 'محمد بنجلون' WHERE id = 110;
UPDATE users SET name_ar = 'أمينة التازي' WHERE id = 111;
UPDATE users SET name_ar = 'فاطمة الزهراء العلمي' WHERE id = 112;
UPDATE users SET name_ar = 'حسن الفيلالي' WHERE id = 113;
UPDATE users SET name_ar = 'كريم الإدريسي' WHERE id = 114;
UPDATE users SET name_ar = 'ليلى برادة' WHERE id = 115;
UPDATE users SET name_ar = 'نادية التازي' WHERE id = 116;
UPDATE users SET name_ar = 'رشيد المنصوري' WHERE id = 117;
UPDATE users SET name_ar = 'أ.د. محمد العمراني' WHERE id = 121;
UPDATE users SET name_ar = 'أ.د. فاطمة بنسودة' WHERE id = 122;
