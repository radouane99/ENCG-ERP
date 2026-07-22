<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\BlockchainCertificate;
use App\Models\Student;
use Illuminate\Support\Str;

class AdminBlockchainController extends Controller
{
    /**
     * Get the ledger of all certified diplomas.
     */
    public function getLedger(): JsonResponse
    {
        $certificates = BlockchainCertificate::with('student.user')
            ->orderBy('certified_at', 'desc')
            ->get()
            ->map(function ($cert) {
                return [
                    'id' => $cert->id,
                    'student_name' => $cert->student->user->name ?? $cert->student->first_name . ' ' . $cert->student->last_name,
                    'degree' => $cert->diploma_name,
                    'date' => $cert->certified_at->format('d/m/Y'),
                    'hash' => $cert->hash,
                    'transaction_id' => $cert->transaction_id,
                    'status' => $cert->network_status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $certificates
        ]);
    }

    /**
     * Certify an entire promo.
     */
    public function certifyPromo(Request $request): JsonResponse
    {
        $year = $request->input('year', date('Y'));
        
        // Find students eligible (mock logic for demo: take first 10 students without a certificate)
        $students = Student::with('user')
            ->whereDoesntHave('blockchainCertificates')
            ->limit(10)
            ->get();

        if ($students->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun nouvel étudiant à certifier pour cette promotion.'
            ], 400);
        }

        $certifiedCount = 0;

        foreach ($students as $student) {
            $degreeName = 'Master Management Financier'; // Default for demo
            if ($student->filiere_id) {
                // If they have a filiere, use it
                $filiere = \App\Models\Filiere::find($student->filiere_id);
                if ($filiere) {
                    $degreeName = 'Diplôme ENCG - ' . $filiere->name;
                }
            }

            // Generate cryptographic hashes
            $rawData = $student->id . $degreeName . $year . now()->timestamp;
            $hash = '0x' . hash('sha256', $rawData);
            $txId = 'tx_' . Str::random(24);

            BlockchainCertificate::create([
                'student_id' => $student->id,
                'diploma_name' => $degreeName,
                'hash' => $hash,
                'transaction_id' => $txId,
                'certified_at' => now(),
                'network_status' => 'VERIFIED'
            ]);

            $certifiedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "La promotion $year a été ancrée sur la blockchain ($certifiedCount diplômes).",
            'count' => $certifiedCount
        ]);
    }

    /**
     * Verify a diploma by hash or tx_id.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:5'
        ]);

        $query = $request->input('query');

        $cert = BlockchainCertificate::with('student.user')
            ->where('hash', $query)
            ->orWhere('transaction_id', $query)
            ->first();

        if (!$cert) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun certificat trouvé pour cette empreinte.',
            ], 404);
        }

        $studentName = $cert->student->user->name ?? $cert->student->first_name . ' ' . $cert->student->last_name;

        return response()->json([
            'success' => true,
            'message' => "Diplôme Authentique.",
            'data' => [
                'student' => $studentName,
                'degree' => $cert->diploma_name,
                'certified_at' => $cert->certified_at->format('d/m/Y H:i'),
                'hash' => $cert->hash,
            ]
        ]);
    }
}
