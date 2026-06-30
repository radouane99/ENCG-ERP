import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Changer la langue"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{currentLang.code}</span>
      </button>

      {isOpen && (
        <div className="absolute end-0 top-10 w-36 bg-card border border-border rounded-xl shadow-xl z-50 py-1 animate-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-foreground",
                i18n.language === lang.code ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
