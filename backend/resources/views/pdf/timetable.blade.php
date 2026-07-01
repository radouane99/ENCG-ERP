<!DOCTYPE html>
<html>
<head>
    <title>Emploi du temps</title>
    <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
    </style>
</head>
<body>
    <h2>Emploi du Temps</h2>
    <table>
        <thead>
            <tr>
                <th>Jour</th>
                <th>Heure</th>
                <th>Module</th>
                <th>Professeur</th>
                <th>Salle</th>
            </tr>
        </thead>
        <tbody>
            @foreach($schedules as $session)
                <tr>
                    <td>Jour {{ $session->day_of_week }}</td>
                    <td>{{ $session->start_time }} - {{ $session->end_time }}</td>
                    <td>{{ $session->module_name }}</td>
                    <td>{{ $session->prof_name }}</td>
                    <td>{{ $session->room_name }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
