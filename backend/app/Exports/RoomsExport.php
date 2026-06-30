<?php

namespace App\Exports;

use App\Models\Room;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RoomsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Salles'; }

    public function collection()
    {
        return Room::all();
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
