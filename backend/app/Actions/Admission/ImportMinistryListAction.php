<?php

namespace App\Actions\Admission;

use App\Models\Application;
use App\Models\AdmissionCampaign;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportMinistryListAction
{
    public function preview(Request $request): array
    {
        AdmissionAccess::review($request);
        $request->validate(['campaign_id' => 'required|integer', 'file' => 'required|file|max:10240']);
        $campaign = AdmissionAccess::campaign($request);
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $first = fgets($handle);
        abort_unless($first !== false, 422, 'Fichier vide.');
        $delimiter = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
        rewind($handle);
        $headers = fgetcsv($handle, 0, $delimiter, '"', '');
        $headers = array_map(fn ($v) => strtolower(trim(str_replace("\xEF\xBB\xBF", '', $v))), $headers ?: []);
        $scoreColumn = $campaign->entry_route === 'cnaem' ? 'admission_score' : 'tafem_score';
        $required = ['cne', 'cin', 'first_name', 'last_name', 'list_type', 'rank', $scoreColumn];
        if ($campaign->entry_route === 'tafem') $required[] = 'bac_average';
        abort_if(array_diff($required, $headers), 422, 'Colonnes requises : '.implode(', ', $required));
        $rows = []; $errors = []; $seen = []; $ranks = []; $line = 1;
        while (($values = fgetcsv($handle, 0, $delimiter, '"', '')) !== false) {
            $line++;
            abort_if($line > 20001, 422, 'Maximum 20 000 candidats par fichier.');
            if ($values === [null]) continue;
            $data = [];
            foreach ($headers as $i => $key) $data[$key] = trim((string) ($values[$i] ?? ''));
            foreach (['cne', 'cin'] as $key) $data[$key] = strtoupper($data[$key] ?? '');
            foreach (['bac_average', $scoreColumn] as $key) $data[$key] = str_replace(',', '.', $data[$key] ?? '');
            $data['tafem_score'] = $data[$scoreColumn];
            $data['list_type'] = strtolower($data['list_type'] ?? '');
            $v = validator($data, ['cne' => ['required', 'regex:/^([A-Z][0-9]{8,9}|[0-9]{10})$/'],
                'cin' => ['required', 'regex:/^[A-Z]{1,2}[0-9]{5,7}$/'], 'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100', 'bac_average' => ($campaign->entry_route === 'tafem' ? 'required' : 'nullable').'|numeric|between:0,20',
                'tafem_score' => 'required|numeric|min:0|max:999.99', 'rank' => 'required|integer|min:1|max:32767',
                'list_type' => 'required|in:liste_principale,liste_attente', 'email' => 'nullable|email|max:255']);
            $messages = $v->errors()->all();
            if (isset($seen[$data['cne']])) $messages[] = 'CNE présent plusieurs fois dans le fichier.';
            if (isset($ranks[$data['rank']])) $messages[] = 'Rang dupliqué : clarifiez la règle officielle des ex aequo avant import.';
            $seen[$data['cne']] = true; $ranks[$data['rank']] = true;
            $existing = Application::where('admission_campaign_id', $campaign->id)->where('cne', $data['cne'])->first();
            if ($existing && (strtoupper((string) $existing->cin) !== $data['cin'] || $existing->dossier_status === 'approved')) $messages[] = 'Identité en conflit ou inscription déjà validée : aucune modification automatique.';
            if ($messages) $errors[] = ['line' => $line, 'messages' => $messages];
            else $rows[] = array_intersect_key($data, array_flip([...$required, 'email']));
        }
        fclose($handle);
        abort_if(! $rows && ! $errors, 422, 'Aucun candidat dans le fichier.');
        $id = DB::table('admission_import_batches')->insertGetId(['admission_campaign_id' => $campaign->id,
            'created_by' => auth()->id(), 'checksum' => hash_file('sha256', $file->getRealPath()),
            'status' => 'preview', 'rows' => json_encode($rows), 'errors' => json_encode($errors), 'created_at' => now(), 'updated_at' => now()]);
        return ['id' => $id, 'valid_rows' => count($rows), 'errors' => $errors, 'preview' => array_slice($rows, 0, 20), 'can_commit' => count($errors) === 0 && count($rows) > 0];
    }

    public function commit(Request $request, int $batchId): array
    {
        AdmissionAccess::review($request);
        return DB::transaction(function () use ($request, $batchId) {
            $batch = DB::table('admission_import_batches')->where('id', $batchId)->lockForUpdate()->first();
            abort_unless($batch && $batch->created_by === auth()->id(), 404);
            $campaign = AdmissionCampaign::whereKey($batch->admission_campaign_id)->where('institution_id', AdmissionAccess::institution($request))->lockForUpdate()->firstOrFail();
            if ($batch->status === 'committed') return ['imported' => 0, 'already_committed' => true];
            abort_if(json_decode($batch->errors, true), 422, 'Corrigez toutes les lignes avant validation.');
            $rows = json_decode($batch->rows, true);
            foreach ($rows as $row) {
                $app = Application::where('admission_campaign_id', $campaign->id)->where('cne', $row['cne'])->lockForUpdate()->first();
                abort_if($app && ($app->cin !== $row['cin'] || $app->dossier_status === 'approved'), 409, 'Le dossier a changé depuis la prévisualisation. Relancez l’import.');
                $data = ['first_name' => $row['first_name'], 'last_name' => $row['last_name'], 'cin' => $row['cin'],
                    'bac_average' => ($row['bac_average'] === '' ? null : $row['bac_average']), 'selection_score' => $row['tafem_score'], 'ranking' => $row['rank'],
                    'eligibility' => $row['list_type'] === 'liste_principale' ? 'main' : 'waiting',
                    'official_rank_source' => 'import:'.$batch->id];
                if (! $app) {
                    $app = new Application(['admission_campaign_id' => $campaign->id, 'cne' => $row['cne'],
                        'reference_number' => strtoupper($campaign->entry_route).'-'.Str::upper(Str::random(14)), 'status' => 'pending', 'dossier_status' => 'draft']);
                    // No fabricated email, phone, birth date, Student or User; activation links an identity later.
                    if (! empty($row['email'])) $data['email'] = strtolower($row['email']);
                } else $app->version++;
                $app->fill($data)->save();
                app(ManageDossierAction::class)->event($app, 'ministry_imported', ['batch_id' => $batch->id]);
            }
            DB::table('admission_import_batches')->where('id', $batchId)->update(['status' => 'committed', 'committed_at' => now(), 'updated_at' => now()]);
            return ['imported' => count($rows), 'already_committed' => false];
        });
    }
}
