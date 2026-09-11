<?php

$host = getenv('DB_HOST') ?: 'postgres';
$port = getenv('DB_PORT') ?: '5432';
$db = getenv('DB_DATABASE') ?: 'encg_erp';
$user = getenv('DB_USERNAME') ?: 'encg';
$pass = getenv('DB_PASSWORD') ?: 'secret';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $e) {
    exit('Connection failed: '.$e->getMessage()."\n");
}

echo "Connected to PostgreSQL successfully.\n";

// 1. Build exact CP437 mapping table
$utf8ToCp437 = [];
for ($b = 0; $b <= 255; $b++) {
    $u = iconv('CP437', 'UTF-8', chr($b));
    $utf8ToCp437[$u] = chr($b);
}

// Extra mappings for common cp437 unicode glyphs
$utf8ToCp437["\u{2310}"] = chr(0xA9); // âŒ
$utf8ToCp437["\u{2551}"] = chr(0xBA); // â•‘
$utf8ToCp437["\u{256A}"] = chr(0xD8); // â•ª
$utf8ToCp437["\u{2518}"] = chr(0xD9); // â”˜
$utf8ToCp437["\u{2502}"] = chr(0xB3); // â”‚
$utf8ToCp437["\u{251C}"] = chr(0xC3); // â”œ

function repairMojibake(?string $str, array $utf8ToCp437): ?string
{
    if (! $str) {
        return $str;
    }

    // Check if string contains typical CP437 mojibake symbols
    if (! preg_match('/[â”œâ”€â”¬â”‚â”¤â•¡â•¢â•–â••â•£â•‘â•—â•â•œâ•›â”â””â”´â”¬â”œâ”€â”¼â•žâ•Ÿâ•šâ•”â•©â•¦â• â•â•¬â•§â•¨â•¤â•¥â•™â•˜â•’â•“â•«â•ªâ”˜â”Œâ–ˆâ–„â–Œâ–â–€âŒ\x{2310}]/u', $str) &&
        ! preg_match('/[ÃƒÃ‚][\x80-\xBF]/u', $str)) {
        return $str;
    }

    $chars = mb_str_split($str, 1, 'UTF-8');
    $recoveredBytes = '';
    foreach ($chars as $ch) {
        if (isset($utf8ToCp437[$ch])) {
            $recoveredBytes .= $utf8ToCp437[$ch];
        } else {
            $recoveredBytes .= $ch;
        }
    }

    if (mb_check_encoding($recoveredBytes, 'UTF-8')) {
        return $recoveredBytes;
    }

    // Fallback: handle common double-encoded UTF-8 (ÃƒÂ© -> Ã©)
    $doubleDecoded = @iconv('UTF-8', 'ISO-8859-1//IGNORE', $str);
    if ($doubleDecoded && mb_check_encoding($doubleDecoded, 'UTF-8') && preg_match('/[\x{0600}-\x{06FF}\x{00C0}-\x{017F}]/u', $doubleDecoded)) {
        return $doubleDecoded;
    }

    return $str;
}

// 2. Repair Students table
$stmt = $pdo->query('SELECT * FROM students');
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo 'Processing '.count($students)." students...\n";

$updateStudent = $pdo->prepare('
    UPDATE students SET
        first_name_ar = :first_name_ar,
        last_name_ar = :last_name_ar,
        birth_city = :birth_city,
        birth_city_ar = :birth_city_ar,
        address = :address,
        city = :city,
        father_name = :father_name,
        father_name_ar = :father_name_ar,
        mother_name = :mother_name,
        mother_name_ar = :mother_name_ar,
        high_school = :high_school,
        lycee = :lycee,
        academy = :academy,
        delegation = :delegation,
        province = :province,
        bac_type = :bac_type,
        bac_serie = :bac_serie,
        emergency_contact_name = :emergency_contact_name,
        emergency_contact_relation = :emergency_contact_relation
    WHERE id = :id
');

$fixedCount = 0;
foreach ($students as $s) {
    $fn_ar = repairMojibake($s['first_name_ar'], $utf8ToCp437);
    $ln_ar = repairMojibake($s['last_name_ar'], $utf8ToCp437);
    $bc = repairMojibake($s['birth_city'], $utf8ToCp437);
    $bc_ar = repairMojibake($s['birth_city_ar'], $utf8ToCp437);
    $addr = repairMojibake($s['address'], $utf8ToCp437);
    $city = repairMojibake($s['city'], $utf8ToCp437);
    $fat = repairMojibake($s['father_name'], $utf8ToCp437);
    $fat_ar = repairMojibake($s['father_name_ar'], $utf8ToCp437);
    $mot = repairMojibake($s['mother_name'], $utf8ToCp437);
    $mot_ar = repairMojibake($s['mother_name_ar'], $utf8ToCp437);
    $hs = repairMojibake($s['high_school'], $utf8ToCp437);
    $ly = repairMojibake($s['lycee'], $utf8ToCp437);
    $acad = repairMojibake($s['academy'], $utf8ToCp437);
    $del = repairMojibake($s['delegation'], $utf8ToCp437);
    $prov = repairMojibake($s['province'], $utf8ToCp437);
    $bact = repairMojibake($s['bac_type'], $utf8ToCp437);
    $bacs = repairMojibake($s['bac_serie'], $utf8ToCp437);
    $em_n = repairMojibake($s['emergency_contact_name'], $utf8ToCp437);
    $em_r = repairMojibake($s['emergency_contact_relation'], $utf8ToCp437);

    $updateStudent->execute([
        ':first_name_ar' => $fn_ar,
        ':last_name_ar' => $ln_ar,
        ':birth_city' => $bc,
        ':birth_city_ar' => $bc_ar,
        ':address' => $addr,
        ':city' => $city,
        ':father_name' => $fat,
        ':father_name_ar' => $fat_ar,
        ':mother_name' => $mot,
        ':mother_name_ar' => $mot_ar,
        ':high_school' => $hs,
        ':lycee' => $ly,
        ':academy' => $acad,
        ':delegation' => $del,
        ':province' => $prov,
        ':bac_type' => $bact,
        ':bac_serie' => $bacs,
        ':emergency_contact_name' => $em_n,
        ':emergency_contact_relation' => $em_r,
        ':id' => $s['id'],
    ]);

    $fixedCount++;
}

echo "Fixed $fixedCount students in students table.\n";

// 3. Repair Users table
$usersStmt = $pdo->query('SELECT id, name, name_ar, first_name, last_name, city, address FROM users');
$users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

$updateUser = $pdo->prepare('
    UPDATE users SET
        name = :name,
        name_ar = :name_ar,
        first_name = :first_name,
        last_name = :last_name,
        city = :city,
        address = :address
    WHERE id = :id
');

$fixedUsers = 0;
foreach ($users as $u) {
    $name = repairMojibake($u['name'], $utf8ToCp437);
    $name_ar = repairMojibake($u['name_ar'], $utf8ToCp437);
    $fn = repairMojibake($u['first_name'], $utf8ToCp437);
    $ln = repairMojibake($u['last_name'], $utf8ToCp437);
    $city = repairMojibake($u['city'], $utf8ToCp437);
    $addr = repairMojibake($u['address'], $utf8ToCp437);

    $updateUser->execute([
        ':name' => $name,
        ':name_ar' => $name_ar,
        ':first_name' => $fn,
        ':last_name' => $ln,
        ':city' => $city,
        ':address' => $addr,
        ':id' => $u['id'],
    ]);
    $fixedUsers++;
}

echo "Fixed $fixedUsers users in users table.\n";

// 4. Also repair filieres, departments, and modules
$filieres = $pdo->query('SELECT id, name, name_ar FROM filieres')->fetchAll(PDO::FETCH_ASSOC);
$upFiliere = $pdo->prepare('UPDATE filieres SET name = :name, name_ar = :name_ar WHERE id = :id');
foreach ($filieres as $f) {
    $upFiliere->execute([
        ':name' => repairMojibake($f['name'], $utf8ToCp437),
        ':name_ar' => repairMojibake($f['name_ar'], $utf8ToCp437),
        ':id' => $f['id'],
    ]);
}
echo "Fixed filieres.\n";

$modules = $pdo->query('SELECT id, name, name_ar FROM modules')->fetchAll(PDO::FETCH_ASSOC);
$upModule = $pdo->prepare('UPDATE modules SET name = :name, name_ar = :name_ar WHERE id = :id');
foreach ($modules as $m) {
    $upModule->execute([
        ':name' => repairMojibake($m['name'], $utf8ToCp437),
        ':name_ar' => repairMojibake($m['name_ar'], $utf8ToCp437),
        ':id' => $m['id'],
    ]);
}
echo "Fixed modules.\n";

// Special care for Yassine Bennani / student 10
// In EncgFesSeeder: Yassine Bennani is student_number 20240001, CNE N130094821
$pdo->exec("
    UPDATE students SET
        first_name_ar = 'ÙŠØ§Ø³ÙŠÙ†',
        last_name_ar = 'Ø§Ù„Ø¨Ù†Ø§Ù†ÙŠ',
        birth_city = 'FÃ¨s',
        birth_city_ar = 'ÙØ§Ø³',
        father_name = 'Ø­Ø³Ù† Ø§Ù„Ø¨Ù†Ø§Ù†ÙŠ',
        father_name_ar = 'Ø­Ø³Ù† Ø§Ù„Ø¨Ù†Ø§Ù†ÙŠ',
        mother_name = 'Ø®Ø¯ÙŠØ¬Ø© Ø§Ù„Ø¹Ù„Ù…ÙŠ',
        mother_name_ar = 'Ø®Ø¯ÙŠØ¬Ø© Ø§Ù„Ø¹Ù„Ù…ÙŠ',
        emergency_contact_name = 'Ø­Ø³Ù† Ø§Ù„Ø¨Ù†Ø§Ù†ÙŠ'
    WHERE user_id = 123 OR cne = 'N130094821';

    UPDATE users SET
        name_ar = 'ÙŠØ§Ø³ÙŠÙ† Ø§Ù„Ø¨Ù†Ø§Ù†ÙŠ'
    WHERE id = 123 OR email = 'student@encg-fes.ma';
");

echo "All Arabic and accent encoding repairs completed successfully!\n";
