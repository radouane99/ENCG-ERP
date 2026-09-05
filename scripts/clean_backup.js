const fs = require('fs');
const path = require('path');

const backupPath = path.resolve(__dirname, '../backups/encg_erp_20260905_020003.sql');
const outputPath = path.resolve(__dirname, '../backend/clean_backup_encg_05_09.sql');

console.log('Reading:', backupPath);
let text = fs.readFileSync(backupPath, 'utf16le');

// 1. Specific string replacements
const stringReplacements = [
    // Institution
    ['╬ô├╢┬úΓö£┬╜cole Nationale de Commerce et de Gestion de F╬ô├╢┬úΓö¼ΓöÉs', 'École Nationale de Commerce et de Gestion de Fès'],
    
    // Clubs
    ["Club d'Entrepreneuriat ENCG F╬ô├╢┬úΓö¼ΓöÉs", "Club d'Entrepreneuriat ENCG Fès"],
    
    // Multi-char mojibake
    ['╬ô├╢┬ú╬ô├«├ë╬ô├╢┬úΓö£Γöétre', 'éâtre'],
    ['╬ô├╢┬ú╬ô├«├ë╬ô├╢┬úΓö£Γöé', 'éâ'],
    ['Amphith├⌐├ótre', 'Amphithéâtre'],
    ['Amphith├─├ótre', 'Amphithéâtre'],
    ['Amphith├®├ótre', 'Amphithéâtre'],
    ['Amphith├─tre', 'Amphithéâtre'],
    ['Amphith├⌐tre', 'Amphithéâtre'],
    ['AmphithÃ©Ã¢tre', 'Amphithéâtre'],
    ['Amphithé├ótre', 'Amphithéâtre'],
    ['Amphithéâtre', 'Amphithéâtre'],
    
    ['╬ô├╢┬ú╬ô├▓├╣', 'û'],
    ['╬ô├╢┬úΓö¼┬╜', 'î'],
    ['╬ô├╢┬ú╬ô├«├ë', 'é'],
    ['╬ô├╢┬úΓö¼ΓöÉ', 'è'],
    ['╬ô├╢┬úΓö£┬╜', 'É'],
    ['╬ô├╢┬úΓö¼┬╝', 'ê'],
    ['╬ô├╢┬ú╬ô├╢├▒', 'ô'],
    ['╬ô├╢┬úΓö¼Γòù', 'ï'],
    ['╬ô├╢┬úΓö£├¡', 'à'],
    ['╬ô├╢┬úΓö¼Γòæ', 'ç'],
    ['Γò¼├┤Γö£├ºΓö£Γòó', '–'],
    ['Γö£ΓîÉ', 'é'],
    ['Γö£├½', 'É'],
    ['Γö£┬┐', 'è'],
    ['├⌐├ó', 'éâ'],
    ['├⌐', 'é'],
    ['├ó', 'â'],
    ['├¿', 'è'],
    ['├ª', 'ê'],
    ['├ë', 'É'],
    ['├á', 'à'],
    ['├¢', 'û'],
    ['├¹', 'ù'],
    ['├º', 'ç'],
    ['├«', 'î'],
    ['├»', 'ï'],
    ['├┤', 'ô'],
    ['â€™', "'"],
    ['Ã©', 'é'],
    ['Ã¨', 'è'],
    ['Ãª', 'ê'],
    ['Ã‰', 'É'],
    ['Ã ', 'à'],
    ['Ã¹', 'ù'],
    ['Ã§', 'ç'],
    ['Ã®', 'î'],
    ['Ã¯', 'ï'],
    ['Ã´', 'ô'],
];

for (const [s, r] of stringReplacements) {
    text = text.replaceAll(s, r);
}

// 2. Normalize newlines to \n before line processing
text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 3. Arabic table fixes
const lines = text.split('\n');
let currentTable = '';

for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('COPY ')) {
        currentTable = l.split(' ')[1];
        continue;
    }
    if (l === '\\.') {
        currentTable = '';
        continue;
    }

    if (currentTable === 'public.institutions') {
        const parts = l.split('\t');
        if (parts[0] === '1') {
            parts[1] = 'École Nationale de Commerce et de Gestion de Fès';
            parts[2] = 'المدرسة الوطنية للتجارة والتسيير بفاس';
            lines[i] = parts.join('\t');
        }
    } else if (currentTable === 'public.clubs') {
        const parts = l.split('\t');
        if (parts[0] === '1') {
            parts[2] = "Club d'Entrepreneuriat ENCG Fès";
            parts[3] = 'نادي المقاولة';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '2') {
            parts[2] = 'Club Arts et Musique ENCG';
            parts[3] = 'نادي الفنون والموسيقى';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '3') {
            parts[2] = 'Club Sportif ENCG (CSEC)';
            parts[3] = 'النادي الرياضي';
            lines[i] = parts.join('\t');
        }
    } else if (currentTable === 'public.departments') {
        const parts = l.split('\t');
        if (parts[0] === '1') {
            parts[2] = 'Sciences de Gestion';
            parts[3] = 'علوم التسيير';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '2') {
            parts[2] = 'Économie Appliquée';
            parts[3] = 'الاقتصاد التطبيقي';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '3') {
            parts[2] = 'Droit des Affaires';
            parts[3] = 'قانون الأعمال';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '4') {
            parts[2] = 'Langues et Communication';
            parts[3] = 'اللغات والتواصل';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '5') {
            parts[2] = 'Informatique de Gestion';
            parts[3] = 'إعلاميات التسيير';
            lines[i] = parts.join('\t');
        }
    } else if (currentTable === 'public.filieres') {
        const parts = l.split('\t');
        if (parts[0] === '1') {
            parts[3] = 'Tronc Commun ENCG';
            parts[4] = 'الجذع المشترك';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '2') {
            parts[3] = 'Gestion Financière et Comptable';
            parts[4] = 'التسيير المالي والمحاسباتي';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '3') {
            parts[3] = 'Management Commercial et Marketing';
            parts[4] = 'التدبير التجاري والتسويق';
            lines[i] = parts.join('\t');
        }
    } else if (currentTable === 'public.students') {
        const parts = l.split('\t');
        if (parts[0] === '86') { // BADR BOUKIR
            parts[6] = 'بدر';
            parts[7] = 'بوكير';
            parts[8] = 'Taroudant';
            parts[26] = 'تارودانت';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '87') { // FATIMA-ZAHRA ENMILI
            parts[6] = 'فاطمة الزهراء';
            parts[7] = 'النميلي';
            parts[26] = 'وجدة';
            lines[i] = parts.join('\t');
        }
    } else if (currentTable === 'public.applications') {
        const parts = l.split('\t');
        if (parts[0] === '8') { // BADR BOUKIR
            parts[13] = 'Bac Sciences Mathématiques B - Option Français';
            parts[28] = 'تارودانت';
            parts[63] = 'بدر';
            parts[64] = 'بوكير';
            parts[65] = 'تارودانت';
            lines[i] = parts.join('\t');
        } else if (parts[0] === '9') { // FATIMA-ZAHRA ENMILI
            parts[13] = 'Bac Sciences Économiques';
            parts[28] = 'وجدة';
            parts[63] = 'فاطمة الزهراء';
            parts[64] = 'النميلي';
            parts[65] = 'فاس';
            lines[i] = parts.join('\t');
        }
    }
}

// 4. Join lines and normalize all line endings to Unix \n (LF)
text = lines.join('\n').replace(/\r/g, '');

// 5. Final regex cleanups for any stray box drawing characters
text = text.replace(/Amphith[^\w\s\n\t]*tre/g, 'Amphithéâtre');
text = text.replace(/B[^\w\s\n\t]*timent/g, 'Bâtiment');
text = text.replace(/S[^\w\s\n\t]*minaire/g, 'Séminaire');

console.log('Writing clean UTF-8 SQL to:', outputPath);
fs.writeFileSync(outputPath, text, 'utf8');

console.log('Done! Output size:', fs.statSync(outputPath).size, 'bytes');
