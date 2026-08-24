<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockchainCertificate;
use App\Models\Filiere;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminBlockchainController extends Controller
{
    /**
     * Registre des diplômes certifiés.
     */
    public function getLedger(): JsonResponse
    {
        $certificates = BlockchainCertificate::with('student.user')
            ->orderByDesc('certified_at')
            ->get()
            ->map(fn ($cert) => [
                'id' => $cert->id,
                'student_name' => $cert->student->user->name ?? $cert->student->first_name.' '.$cert->student->last_name,
                'degree' => $cert->diploma_name,
                'date' => $cert->certified_at->format('d/m/Y'),
                'hash' => $cert->hash,
                'transaction_id' => $cert->transaction_id,
                'status' => $cert->network_status,
            ]);

        return response()->json([
            'success' => true,
            'data' => $certificates,
        ]);
    }

    /**
     * Certifier une promotion entière.
     */
    public function certifyPromo(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));

        $students = Student::with(['user', 'latestPathway.filiere', 'registrations.academicYear'])
            ->whereDoesntHave('blockchainCertificates')
            ->where('status', 'graduated')
            ->where(function ($query) use ($year) {
                $query->where('student_number', 'like', $year.'%')
                    ->orWhereHas('registrations', function ($registrations) use ($year) {
                        $registrations->whereHas('academicYear', function ($academicYear) use ($year) {
                            $academicYear->where('end_year', $year)->orWhere('start_year', $year);
                        });
                    })
                    ->orWhereHas('pathways', function ($pathways) use ($year) {
                        $pathways->whereHas('academicYear', function ($academicYear) use ($year) {
                            $academicYear->where('end_year', $year)->orWhere('start_year', $year);
                        });
                    });
            })
            ->get();

        if ($students->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun nouvel étudiant à certifier pour cette promotion.',
            ], 400);
        }

        $certifiedCount = 0;

        foreach ($students as $student) {
            $degreeName = 'Diplôme ENCG';
            $filiere = $student->latestPathway?->filiere
                ?? ($student->filiere_id ? Filiere::find($student->filiere_id) : null);
            if ($filiere) {
                $degreeName = 'Diplôme ENCG - '.$filiere->name;
            }

            $rawData = $student->id.$degreeName.$year.now()->timestamp;
            $hash = '0x'.hash('sha256', $rawData);
            $txId = 'tx_'.Str::random(24);

            BlockchainCertificate::create([
                'student_id' => $student->id,
                'diploma_name' => $degreeName,
                'hash' => $hash,
                'transaction_id' => $txId,
                'certified_at' => now(),
                'network_status' => 'VERIFIED',
            ]);

            $certifiedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "La promotion {$year} a été ancrée sur la blockchain ({$certifiedCount} diplômes).",
            'count' => $certifiedCount,
        ]);
    }

    /**
     * Vérifier un diplôme par hash ou transaction.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:5',
        ]);

        $cert = BlockchainCertificate::with('student.user')
            ->where('hash', $request->input('query'))
            ->orWhere('transaction_id', $request->input('query'))
            ->first();

        if (! $cert) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun certificat trouvé.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Diplôme Authentique.',
            'data' => [
                'student' => $cert->student->user->name ?? 'N/A',
                'degree' => $cert->diploma_name,
                'certified_at' => $cert->certified_at->format('d/m/Y H:i'),
                'hash' => $cert->hash,
            ],
        ]);
    }
}
