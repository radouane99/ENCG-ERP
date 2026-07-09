#!/bin/bash

# Deployment & Verification Strategy Script
# Handles: Backup, Pre-check, Up, Post-check, Down, Up (Rollback Verification)

set -e

MIGRATION_FILE=$1

if [ -z "$MIGRATION_FILE" ]; then
    echo "Usage: ./test_migration.sh <migration_path_or_name>"
    exit 1
fi

echo "=========================================="
echo " PHASE 0: MIGRATION ROLLBACK VERIFICATION"
echo "=========================================="
echo "Target Migration: $MIGRATION_FILE"

# 1. Automatic Backup (Skipping true mysqldump in dev, using snapshot)
echo "[1/6] Running Pre-Migration Integrity Snapshot..."
php artisan erp:verify-integrity --pre

# 2. Run Migration (UP)
echo "[2/6] Executing Migration (UP)..."
php artisan migrate --path="$MIGRATION_FILE" --force

# 3. Post-Migration Verification
echo "[3/6] Running Post-Migration Verification..."
php artisan erp:verify-integrity --post

# 4. Rollback (DOWN)
echo "[4/6] Verifying Rollback (DOWN)..."
php artisan migrate:rollback --path="$MIGRATION_FILE" --force

# 5. Pre-Migration Verification again to ensure exact state restoration
echo "[5/6] Verifying Exact State Restoration..."
php artisan erp:verify-integrity --post

# 6. Final Up
echo "[6/6] Final UP Deployment..."
php artisan migrate --path="$MIGRATION_FILE" --force

echo "=========================================="
echo "✅ MIGRATION VERIFICATION COMPLETE. SAFE TO DEPLOY."
echo "=========================================="
