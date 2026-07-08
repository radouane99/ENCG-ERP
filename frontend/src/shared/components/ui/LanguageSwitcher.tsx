import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 outline-none", className)}>
        <Languages className="w-5 h-5" />
        <span className="text-sm font-medium uppercase">{i18n.language}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem 
          onClick={() => changeLanguage('fr')} 
          className={cn("cursor-pointer flex justify-between", i18n.language === 'fr' && "bg-muted font-bold")}
        >
          Français
          {i18n.language === 'fr' && <span>✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('ar')}
          className={cn("cursor-pointer flex justify-between", i18n.language === 'ar' && "bg-muted font-bold")}
        >
          العربية
          {i18n.language === 'ar' && <span>✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
