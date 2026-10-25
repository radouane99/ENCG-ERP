import { cn } from '@shared/lib/utils';
import { DocumentRequestStatus } from '../model/types';

export function DocumentStatusBadge({ status }: { status: DocumentRequestStatus }) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-medium border",
      status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
      status === 'processing' ? "bg-primary/5 text-primary border-primary/20" :
      status === 'ready' ? "bg-green-50 text-green-600 border-green-200" :
      "bg-red-50 text-red-600 border-red-200"
    )}>
      {status === 'pending' ? 'En attente' :
       status === 'processing' ? 'En cours' :
       status === 'ready' ? 'Prêt' :
       status === 'rejected' ? 'Refusé' : 'Annulé'}
    </span>
  );
}
