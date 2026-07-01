<!DOCTYPE html>
<html>
<head>
    <title>Convocation aux Examens - ENCG</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Bonjour {{ $studentName }},</h2>
    
    <p>Veuillez trouver ci-joint votre convocation officielle pour l'examen :</p>
    
    <ul>
        <li><strong>Module :</strong> {{ $moduleName }}</li>
        <li><strong>Date :</strong> {{ $examDate }}</li>
        <li><strong>Heure :</strong> {{ $examTime }}</li>
        <li><strong>Salle :</strong> {{ $roomName }}</li>
    </ul>

    <p><strong>Instructions importantes :</strong></p>
    <ul>
        <li>Présentez-vous 15 minutes avant le début de l'épreuve.</li>
        <li>Munissez-vous de votre carte d'étudiant ou d'une pièce d'identité.</li>
        <li>Le QR code présent sur la convocation sera scanné à l'entrée de la salle.</li>
    </ul>

    <p>Cordialement,<br>
    L'Administration de l'ENCG</p>
</body>
</html>
