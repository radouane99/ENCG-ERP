<?php

namespace App\Imports;

use App\Models\Room;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class RoomsImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row)
    {
        $room = Room::firstOrNew(['code' => $row['code'] ?? null]);

        $room->name                 = $row['nom'] ?? $room->name;
        $room->type                 = $row['type'] ?? $room->type ?? 'Amphi';
        $room->capacity             = $row['capacite'] ?? $room->capacity ?? 30;
        $room->building             = $row['batiment'] ?? $room->building;
        $room->floor                = $row['etage'] ?? $room->floor;
        $room->equipment            = $row['equipements'] ? explode(',', $row['equipements']) : ($room->equipment ?? []);
        $room->availability_status  = $row['disponibilite'] ?? $room->availability_status ?? 'available';
        $room->is_active            = strtolower($row['statut'] ?? 'actif') === 'actif' ? 1 : 0;

        $this->imported++;
        return $room;
    }
}
