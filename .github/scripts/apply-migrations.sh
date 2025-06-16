#!/bin/bash

# Script to apply migrations incrementally
# This script tracks which migrations have been applied and only runs new ones

# Set PostgreSQL connection parameters
PG_HOST="localhost"
PG_PORT="54322"
PG_USER="postgres"
PG_PASSWORD="postgres"
PG_DATABASE="postgres"

# Directory containing migrations
MIGRATIONS_DIR="supabase/migrations"

# File to store the last applied migration
LAST_MIGRATION_FILE=".last_migration"

# Create tracking table if it doesn't exist
echo "Checking if migration tracking table exists..."
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -c "
CREATE TABLE IF NOT EXISTS _migration_history (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"

# Get list of already applied migrations
echo "Getting list of already applied migrations..."
APPLIED_MIGRATIONS=$(PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -t -c "SELECT migration_name FROM _migration_history ORDER BY id;")

# Get all migration files
echo "Finding all migration files..."
MIGRATION_FILES=$(find $MIGRATIONS_DIR -name "*.sql" | sort)

# Apply migrations that haven't been applied yet
for MIGRATION_FILE in $MIGRATION_FILES; do
    MIGRATION_NAME=$(basename $MIGRATION_FILE)

    # Check if migration has already been applied
    if echo "$APPLIED_MIGRATIONS" | grep -q "$MIGRATION_NAME"; then
        echo "Migration already applied: $MIGRATION_NAME"
    else
        echo "Applying migration: $MIGRATION_NAME"

        # Apply the migration
        PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -f $MIGRATION_FILE

        # Record the migration in the tracking table
        PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -c "
        INSERT INTO _migration_history (migration_name) VALUES ('$MIGRATION_NAME');"

        echo "Migration applied: $MIGRATION_NAME"
    fi
done

echo "All migrations applied successfully!"
