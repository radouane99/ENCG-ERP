import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminTafem() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/academic/enrollments?tab=tafem', { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold text-sm">Redirection vers le hub Inscriptions & TAFEM...</p>
    </div>
  );
}
