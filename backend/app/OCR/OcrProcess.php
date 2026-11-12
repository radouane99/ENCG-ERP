<?php

namespace App\OCR;

use Symfony\Component\Process\Process;

final class OcrProcess
{
    private static ?float $deadline = null;

    public static function budget(int $seconds): void
    {
        self::$deadline = microtime(true) + $seconds;
    }

    public static function reset(): void
    {
        self::$deadline = null;
    }

    public static function run(string $command, ?array &$output = null, ?int &$exitCode = null): void
    {
        $remaining = self::$deadline === null ? 12 : self::$deadline - microtime(true);
        if ($remaining <= 0) {
            throw new \RuntimeException('OCR processing deadline reached.');
        }
        // Linux worker limits inherited by native parsers, before untrusted bytes are read.
        // Fail closed if the worker shell cannot establish the limits.
        $boundedCommand = 'ulimit -v 786432 && ulimit -f 65536 && ulimit -t 12 && { '.$command.'; }';
        $p = Process::fromShellCommandline($boundedCommand);
        $p->setTimeout(min(12, $remaining));
        $p->run();
        $exitCode = $p->getExitCode() ?? 1;
        $output = preg_split('/\r?\n/', trim($p->getOutput())) ?: [];
    }
}
