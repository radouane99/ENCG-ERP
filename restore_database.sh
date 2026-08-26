#!/bin/bash
# ==============================================================================
# ENCG ERP - Script de Restauration Automatique de la Base de Données (PostgreSQL)
# ==============================================================================
set -e

echo "================================================================"
echo "  🔄 ENCG ERP - Restauration Automatique de la Base de Données  "
echo "================================================================"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_FILE="$DIR/backup_encg_erp_latest.sql"
if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="$DIR/backup_encg_erp.sql"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erreur : Fichier de sauvegarde introuvable !"
    exit 1
fi

echo "📦 1. Utilisation du fichier de sauvegarde : $BACKUP_FILE"

# 1. Copier les fichiers dans le conteneur PostgreSQL
echo "🐳 2. Transfert vers le conteneur Docker (encg_postgres)..."
docker cp "$BACKUP_FILE" encg_postgres:/tmp/restore.sql
docker cp "$DIR/scripts/fix_pks.sql" encg_postgres:/tmp/fix_pks.sql

# 2. Réinitialiser le schéma et restaurer le dump
echo "🧹 3. Nettoyage du schéma 'public' et restauration..."
docker exec encg_postgres psql -U encg -d encg_erp -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'encg_erp' AND pid <> pg_backend_pid(); DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO encg; GRANT ALL ON SCHEMA public TO public;"
docker exec encg_postgres psql -U encg -d encg_erp -f /tmp/restore.sql

# 3. Appliquer les Primary Keys et Contraintes
echo "🔑 4. Application des Primary Keys et contraintes d'unicité..."
docker exec encg_postgres psql -U encg -d encg_erp -f /tmp/fix_pks.sql

# 4. Exécuter les migrations récentes
echo "🐘 5. Synchronisation des Migrations Laravel..."
docker exec encg_backend php artisan migrate --force

# 5. Nettoyer les caches Laravel et redémarrer la Queue
echo "⚡ 6. Nettoyage des caches et redémarrage de la Queue..."
docker exec encg_backend php artisan optimize:clear
docker exec encg_backend php artisan queue:restart

echo ""
echo "================================================================"
echo "  ✅ RESTAURATION TERMINÉE AVEC SUCCÈS (100% OPÉRATIONNEL) !    "
echo "================================================================"
docker exec encg_postgres psql -U encg -d encg_erp -c "SELECT 'users' AS table_name, count(*) AS total FROM users UNION ALL SELECT 'students', count(*) FROM students UNION ALL SELECT 'professors', count(*) FROM professors UNION ALL SELECT 'filieres', count(*) FROM filieres UNION ALL SELECT 'modules', count(*) FROM modules UNION ALL SELECT 'exams', count(*) FROM exams UNION ALL SELECT 'schedules', count(*) FROM schedules;"
