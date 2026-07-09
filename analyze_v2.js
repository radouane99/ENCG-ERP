const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./backend/db_schema_dump.json', 'utf8'));
const modelsDir = fs.readdirSync('./backend/app/Models').map(f => f.replace('.php', ''));

const report = {
    missingIndexes: [],
    redundantColumns: [],
    normalizationViolations: [],
    missingForeignKeys: [],
    inconsistentTypes: [],
    businessRuleSuggestions: [],
    timetableTablesMissing: [],
    models: {
        unused: [],
        existing: modelsDir
    }
};

const timetableRequired = [
    'holidays', 'campuses', 'buildings', 'floors', 'room_maintenance',
    'room_unavailabilities', 'professor_unavailabilities', 'teacher_constraints',
    'room_constraints', 'student_constraints', 'equipment_constraints', 'course_constraints',
    'schedule_constraints', 'schedule_preferences', 'schedule_versions', 'schedule_conflicts',
    'professor_workloads', 'room_equipments', 'equipment_types'
];

timetableRequired.forEach(table => {
    if (!data[table]) {
        report.timetableTablesMissing.push(table);
    }
});

Object.keys(data).forEach(tableName => {
    const table = data[tableName];
    const columns = table.columns;
    const colNames = columns.map(c => c.Field);
    
    // Normalization & Redundancy
    if (['students', 'professors'].includes(tableName)) {
        const personalCols = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'birth_date'];
        const overlaps = personalCols.filter(c => colNames.includes(c));
        if (overlaps.length > 0) {
            report.normalizationViolations.push({ table: tableName, columns: overlaps, issue: 'Personal data should be moved to users table (3NF)' });
        }
    }

    if (tableName === 'groups' && colNames.includes('current_count')) {
        report.redundantColumns.push({ table: tableName, column: 'current_count', reason: 'Can be calculated via student_registrations withCount()' });
    }

    if (tableName === 'attendances' && colNames.includes('is_justified')) {
        report.redundantColumns.push({ table: tableName, column: 'is_justified', reason: 'Can be inferred from absence_justifications relation' });
    }

    // Historical vs Redundant in attendance_sessions
    if (tableName === 'attendance_sessions' && colNames.includes('schedule_id')) {
        const redundant = ['module_id', 'group_id', 'professor_id', 'room_id'].filter(c => colNames.includes(c));
        if (redundant.length > 0) {
            report.businessRuleSuggestions.push({
                table: tableName,
                issue: `attendance_sessions has schedule_id AND [${redundant.join(', ')}]. If schedules change, are these meant as immutable historical snapshots or are they 100% redundant? Recommendation: If redundant, DROP. If snapshot, keep as historical record.`
            });
        }
    }

    // Foreign Keys & Indexes
    const fkColumns = columns.filter(c => c.Field.endsWith('_id') && c.Field !== 'id');
    const indexNames = table.indexes.map(i => i.Column_name);
    
    fkColumns.forEach(fkCol => {
        const fk = fkCol.Field;
        if (!indexNames.includes(fk)) {
            report.missingIndexes.push({ table: tableName, column: fk });
        }
        
        const hasConstraint = table.foreign_keys.some(f => f.COLUMN_NAME === fk);
        if (!hasConstraint && !fk.includes('morph') && !['subject_id', 'causer_id', 'model_id', 'uuid'].includes(fk)) {
            report.missingForeignKeys.push({ table: tableName, column: fk });
        }
        
        // Inconsistent types: FKs should usually be bigint unsigned
        if (fkCol.Type !== 'bigint unsigned' && !['uuid', 'string'].some(s => fkCol.Type.includes(s))) {
             report.inconsistentTypes.push({ table: tableName, column: fk, type: fkCol.Type, expected: 'bigint unsigned' });
        }
    });

    // Boolean optimization
    columns.forEach(c => {
        if (c.Type === 'tinyint(1)') {
            report.inconsistentTypes.push({ table: tableName, column: c.Field, type: c.Type, expected: 'boolean' });
        }
    });
});

fs.writeFileSync('audit_v2.json', JSON.stringify(report, null, 2));
console.log('Audit V2 complete.');
