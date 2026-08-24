<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamSeating extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_present' => 'boolean',
        ];
    }

    /**
     * Official PV totals: unrecorded seating (null) is treated as absent,
     * matching ExamCourseAttendanceService::examAbsenceCount.
     *
     * @param  iterable<mixed>  $seatings
     * @return array{total_students: int, present_students: int, absent_students: int}
     */
    public static function pvAttendanceTotals(iterable $seatings): array
    {
        $all = collect($seatings);
        $total = $all->count();
        $present = $all->filter(fn ($s) => (bool) data_get($s, 'is_present'))->count();

        return [
            'total_students' => $total,
            'present_students' => $present,
            'absent_students' => $total - $present,
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
