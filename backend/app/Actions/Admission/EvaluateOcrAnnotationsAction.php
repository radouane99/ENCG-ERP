<?php
namespace App\Actions\Admission;

use App\Domain\Admission\OcrEvaluation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class EvaluateOcrAnnotationsAction
{
    public function execute(UploadedFile $file): array
    {
        try { $input = json_decode($file->get(), true, 32, JSON_THROW_ON_ERROR); }
        catch (\JsonException) { throw ValidationException::withMessages(['file' => 'Fichier JSON invalide.']); }
        if (! is_array($input)) throw ValidationException::withMessages(['file' => 'Un objet JSON est requis.']);
        $data = Validator::make($input, ['dataset_kind' => 'required|in:synthetic,authorized_real', 'samples' => 'required|array|list|min:1|max:500',
            'samples.*.document_type' => ['required', Rule::in(['bac', 'cnie', 'releve_notes', 'photo', 'attestation_admission', 'releve_parcours'])],
            'samples.*.expected' => 'required|array|min:1|max:12', 'samples.*.extracted' => 'present|array|max:12'])->validate();
        foreach ($data['samples'] as $index => $sample) {
            foreach (['expected', 'extracted'] as $side) foreach ($sample[$side] as $field => $value) {
                if (! in_array($field, OcrEvaluation::FIELDS, true) || (! is_string($value) && ! is_int($value) && ! is_float($value) && ! ($side === 'extracted' && $value === null))
                    || (is_string($value) && (mb_strlen($value) > 300 || ($side === 'expected' && trim($value) === '')))) {
                    throw ValidationException::withMessages(['file' => 'Annotation invalide à la ligne '.($index + 1).'. Vérifiez les champs et les valeurs du modèle.']);
                }
            }
        }
        return app(OcrEvaluation::class)->evaluate($data['samples'], $data['dataset_kind']);
    }
}
