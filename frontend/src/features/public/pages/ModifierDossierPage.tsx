import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import InscriptionPage from './InscriptionPage';

/**
 * Page Modifier Mon Dossier
 * ==========================
 * نفس واجهة التسجيل (InscriptionPage) ولكن في وضعية التعديل (editMode=true):
 *   - كيطلّع البيانات من PostgreSQL
 *   - عند الإرسال كيخدم POST /public/update-candidate-dossier
 *   - ملي تنجح العملية كيرجع للـ Dashboard
 */
export default function ModifierDossierPage() {
  // التحقق من أن المستخدم مسجل دخول قبل ما يعدل الدوسييه
  const { isAuthenticated, user } = useAuthStore();

  // إلا كان المسجل ماشي مصادق، طيرحو للصفحة د الدخول
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // إرجاع صفحة التسجيل مع تفعيل Edit Mode
  return <InscriptionPage editMode={true} />;
}