<?php

namespace App\OCR\Helpers;

/**
 * BAC Fields Helper
 *
 * Extracts academic metadata shared between BAC and Relevé parsers:
 *  - Bac Type (filière / série)
 *  - Bac Mention
 *  - Lycée / High School name
 */
class BacFieldsHelper
{
    /**
     * Map of regex patterns → normalised filière label.
     */
    private array $bacTypePatterns = [
        '/Sciences\s+Economiques\s+et\s+de\s+Gestion/iu'            => 'Sciences Économiques et de Gestion',
        '/Sciences\s+Économiques\s+et\s+de\s+Gestion/iu'            => 'Sciences Économiques et de Gestion',
        '/Sciences\s+Économiques/iu'                                 => 'Sciences Économiques',
        '/Sciences\s+Economiques/iu'                                 => 'Sciences Économiques',
        '/Sciences\s+Mathématiques\s*[AB]/iu'                        => 'Sciences Mathématiques',
        '/Sciences\s+Mathematiques\s*[AB]/iu'                        => 'Sciences Mathématiques',
        '/Sciences\s+Physiques\s+(?:et\s+Chimie)?/iu'               => 'Sciences Physiques',
        '/Sciences\s+de\s+la\s+Vie\s+et\s+de\s+la\s+Terre/iu'      => 'Sciences de la Vie et de la Terre',
        '/مسلك\s+العلوم\s+الاقتصادية/u'                             => 'Sciences Économiques',
        '/مسلك\s+علوم\s+الحياة\s+والأرض/u'                         => 'Sciences de la Vie et de la Terre',
        '/مسلك\s+العلوم\s+الفيزيائية/u'                             => 'Sciences Physiques',
        '/مسلك\s+العلوم\s+الرياضيات/u'                              => 'Sciences Mathématiques',
        '/\bSVT\b/'                                                  => 'Sciences de la Vie et de la Terre',
        '/\bPCi?\b|\bSPC\b/'                                         => 'Sciences Physiques',
        '/\bSMA\b|\bSMB\b|\bSM\b/'                                  => 'Sciences Mathématiques',
        '/\bSGC\b/'                                                  => 'Sciences de Gestion Comptable',
        '/\bSE\b/'                                                   => 'Sciences Économiques',
        '/\bSP\b/'                                                   => 'Sciences Physiques',
        '/Lettres\s+(?:et\s+)?(?:Sciences\s+Humaines)?/iu'          => 'Lettres et Sciences Humaines',
        '/\bBAC\s+PRO\b/i'                                           => 'Baccalauréat Professionnel',
    ];

    /**
     * Extract normalised Bac filière / série label.
     */
    public function extractBacType(string $text): string
    {
        foreach ($this->bacTypePatterns as $pattern => $label) {
            if (preg_match($pattern, $text)) {
                return $label;
            }
        }
        return '';
    }

    /**
     * Extract Bac mention (Très Bien, Bien, Assez Bien, Passable).
     */
    public function extractBacMention(string $text): string
    {
        if (preg_match('/(?:MENTION|ADMIS[^\n]*MENTION)\s+(TRÈS\s+BIEN|TRES\s+BIEN|BIEN|ASSEZ\s+BIEN|PASSABLE)/iu', $text, $m)) {
            return mb_strtoupper(trim($m[1]));
        }
        if (preg_match('/(Très\s+Bien|Tres\s+Bien|Bien|Assez\s+Bien|Passable)/iu', $text, $m)) {
            return mb_strtoupper(trim($m[1]));
        }
        return '';
    }

    /**
     * Extract Lycée / High School name.
     */
    public function extractHighSchool(string $text): string
    {
        if (preg_match(
            '/(?:Etablissement|Lycée\s+(?:Qualifiant)?|Lycee\s+(?:Qualifiant)?)\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔéèêàùîô\s\'\-]+?)(?=\n|\r|$|Niveau|Deuxième|Direction)/iu',
            $text, $m
        )) {
            return trim(preg_replace('/\s+/', ' ', $m[1]));
        }
        return '';
    }
}
