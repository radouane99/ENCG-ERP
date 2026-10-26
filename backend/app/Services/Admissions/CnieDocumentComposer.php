<?php

namespace App\Services\Admissions;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\UploadedFile;

final class CnieDocumentComposer
{
    public function compose(UploadedFile $recto, UploadedFile $verso): string
    {
        $pages = [];
        foreach ([$recto, $verso] as $index => $file) {
            $image = imagecreatefromstring(file_get_contents($file->getRealPath()));
            abort_unless($image, 422, 'Image CNIE illisible.');
            // Flatten image metadata and bound the generated PDF size.
            $ratio = min(1, 2200 / max(imagesx($image), imagesy($image)));
            $canvas = imagecreatetruecolor(max(1, (int) (imagesx($image) * $ratio)), max(1, (int) (imagesy($image) * $ratio)));
            imagefill($canvas, 0, 0, imagecolorallocate($canvas, 255, 255, 255));
            imagecopyresampled($canvas, $image, 0, 0, 0, 0, imagesx($canvas), imagesy($canvas), imagesx($image), imagesy($image));
            ob_start();
            imagejpeg($canvas, null, 90);
            $data = base64_encode(ob_get_clean());
            imagedestroy($image);
            imagedestroy($canvas);
            $pages[] = '<section style="'.($index === 0 ? 'page-break-after:always' : '').'"><h1>CNIE — '.($index === 0 ? 'Recto' : 'Verso').'</h1><img src="data:image/jpeg;base64,'.$data.'"></section>';
        }

        return Pdf::loadHTML('<html><head><style>@page{margin:25px}body{font-family:DejaVu Sans}h1{font-size:14px}img{max-width:740px;max-height:480px}</style></head><body>'.implode('', $pages).'</body></html>')
            ->setPaper('a4', 'landscape')->setOptions(['isRemoteEnabled' => false, 'isPhpEnabled' => false])->output();
    }
}
