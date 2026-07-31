import InscriptionPage from './InscriptionPage';

/**
 * Page Modifier Mon Dossier — exactement la même interface que l'inscription
 * mais en mode édition (editMode=true):
 *   - Pré-remplie avec les données existantes depuis PostgreSQL
 *   - Submit envoie à POST /public/update-candidate-dossier
 *   - Redirect vers /dashboard après succès
 */
export default function ModifierDossierPage() {
  return <InscriptionPage editMode={true} />;
}
