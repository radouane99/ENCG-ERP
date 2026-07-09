const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./backend/db_schema_dump.json', 'utf8'));
const report = {
    missingIndexes: [],
    redundantColumns: [],
    orphans: [],
    normalizationIssues: [],
    missingForeignKeys: []
};

// Check for conventions and obvious redundancies
Object.keys(data).forEach(tableName => {
    const table = data[tableName];
    const columns = table.columns.map(c => c.Field);
    
    // 1. Redundant Columns in attendance_sessions and others
    if (tableName === 'attendance_sessions' && columns.includes('schedule_id')) {
        const redundant = ['module_id', 'group_id', 'professor_id', 'room_id'].filter(c => columns.includes(c));
        if (redundant.length > 0) {
            report.redundantColumns.push({ table: tableName, columns: redundant, reason: 'Can be fetched via schedule_id' });
        }
    }

    // 2. Calculated columns
    if (tableName === 'groups' && columns.includes('current_count')) {
        report.normalizationIssues.push({ table: tableName, column: 'current_count', reason: 'Should be calculated dynamically' });
    }
    
    // 3. Absence Management
    if (tableName === 'absences' || tableName === 'attendances') {
        if (columns.includes('is_justified') && Object.keys(data).includes('absence_justifications')) {
            report.redundantColumns.push({ table: tableName, columns: ['is_justified'], reason: 'Inferred from absence_justifications table' });
        }
    }

    // 4. Check for foreign keys without indexes
    const fkColumns = columns.filter(c => c.endsWith('_id'));
    const indexNames = table.indexes.map(i => i.Column_name);
    
    fkColumns.forEach(fk => {
        if (!indexNames.includes(fk)) {
            report.missingIndexes.push({ table: tableName, column: fk, reason: 'Foreign key missing index' });
        }
        
        // Check if there is an actual foreign key constraint
        const hasConstraint = table.foreign_keys.some(f => f.COLUMN_NAME === fk);
        if (!hasConstraint && fk !== 'id' && !fk.includes('morph')) { // Ignore polymorphic for now
            report.missingForeignKeys.push({ table: tableName, column: fk });
        }
    });

    // 5. Personal Information in students/professors
    if (tableName === 'students' || tableName === 'professors') {
        const personalCols = ['first_name', 'last_name', 'email', 'phone', 'address', 'city'];
        const overlaps = personalCols.filter(c => columns.includes(c));
        if (overlaps.length > 0) {
            report.normalizationIssues.push({ table: tableName, columns: overlaps, reason: 'Belongs in users table' });
        }
    }
});

fs.writeFileSync('schema_analysis_report.json', JSON.stringify(report, null, 2));
console.log('Analysis complete.');
