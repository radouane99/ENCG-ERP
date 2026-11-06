<?php

namespace App\Exports;

use App\Models\Room;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RoomsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        protected bool $isTemplate = false,
        protected ?int $institutionId = null
    ) {}

    public function title(): string
    {
        return 'Salles';
    }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([]);
        }

        $instId = $this->institutionId ?? Auth::user()?->institution_id;

        return Room::query()
            ->when($instId, fn ($q) => $q->where('institution_id', $instId))
            ->get();
    }

    public function headings(): array
    {
        return ['Code', 'Nom', 'Type', 'Capacité', 'Bâtiment', 'Étage', 'Équipements', 'Disponibilité', 'Statut'];
    }

    public function map($room): array
    {
        return [
            $room->code,
            $room->name,
            $room->type,
            $room->capacity,
            $room->building,
            $room->floor,
            is_array($room->equipment) ? implode(', ', $room->equipment) : $room->equipment,
            $room->availability_status,
            $room->is_active ? 'Actif' : 'Inactif',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'dc2626']],
            ],
        ];
    }
}
