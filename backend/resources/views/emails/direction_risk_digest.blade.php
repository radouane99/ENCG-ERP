<p>Digest hebdomadaire (sans notes nominatives transmises à un LLM).</p>
<p>Absentéisme cours : {{ $courseAbsences }} — modules à risque (&lt; 6/20) : {{ $modulesAtRisk }}.</p>
<table>
    <thead>
        <tr>
            <th>Étudiant</th>
            <th>Module</th>
            <th>CC/Exam</th>
            <th>Absences cours</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($warnings as $row)
            <tr>
                <td>#{{ $row['student_id'] ?? '' }}</td>
                <td>{{ $row['module'] ?? '' }}</td>
                <td>{{ $row['exam_or_cc'] ?? '' }}</td>
                <td>{{ $row['course_absences'] ?? 0 }}</td>
            </tr>
        @empty
            <tr><td colspan="4">Aucune alerte.</td></tr>
        @endforelse
    </tbody>
</table>
