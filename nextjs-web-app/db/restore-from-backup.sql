-- SQL script to restore database from backup schema
-- WARNING: This will overwrite your current production data with data from the backup.
-- ALWAYS create a fresh backup before running this script!

-- This script should be run as the postgres user or a user with appropriate privileges

-- Function to restore all tables from backup to public schema
CREATE OR REPLACE FUNCTION restore_all_tables_from_backup()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    backup_table_rec RECORD;
    original_table TEXT;
BEGIN
    -- Disable triggers temporarily to avoid conflicts during restoration
    SET session_replication_role = 'replica';
    
    FOR backup_table_rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'backup' 
        AND tablename LIKE '%_backup'
    LOOP
        -- Extract original table name (remove _backup suffix)
        original_table := regexp_replace(backup_table_rec.tablename, '_backup$', '');
        
        -- Check if original table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = original_table) THEN
            RAISE NOTICE 'Restoring table: %', original_table;
            
            -- Truncate the original table
            EXECUTE format('TRUNCATE TABLE public.%I CASCADE', original_table);
            
            -- Copy data from backup to original
            EXECUTE format('INSERT INTO public.%I SELECT * FROM backup.%I', 
                          original_table, backup_table_rec.tablename);
            
            RAISE NOTICE 'Successfully restored table: %', original_table;
        ELSE
            RAISE NOTICE 'Original table % does not exist, skipping restoration', original_table;
        END IF;
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
    
    -- Log the restoration
    INSERT INTO backup.backup_info (description, backup_date) 
    VALUES ('Restored from backup via SQL script', NOW());
    
    RAISE NOTICE 'Database restoration completed successfully!';
END;
$$;

-- Function to restore triggers from backup
CREATE OR REPLACE FUNCTION restore_triggers_from_backup()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT table_name, trigger_name, trigger_definition
        FROM backup.triggers_backup
    LOOP
        BEGIN
            -- Drop the trigger if it exists
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 
                          trigger_rec.trigger_name, trigger_rec.table_name);
            
            -- Create the trigger using the backed up definition
            EXECUTE trigger_rec.trigger_definition;
            
            RAISE NOTICE 'Restored trigger: %', trigger_rec.trigger_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error restoring trigger %: %', trigger_rec.trigger_name, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Function to restore policies from backup
CREATE OR REPLACE FUNCTION restore_policies_from_backup()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT table_name, policy_name, policy_definition
        FROM backup.policies_backup
    LOOP
        BEGIN
            -- Drop the policy if it exists
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                          policy_rec.policy_name, policy_rec.table_name);
            
            -- Create the policy using the backed up definition
            EXECUTE policy_rec.policy_definition;
            
            RAISE NOTICE 'Restored policy: %', policy_rec.policy_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error restoring policy %: %', policy_rec.policy_name, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Main restoration script with transaction support
DO $$
BEGIN
    -- Start transaction
    BEGIN
        -- Confirm backup tables exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'backup' 
            AND tablename LIKE '%_backup'
        ) THEN
            RAISE EXCEPTION 'No backup tables found in the backup schema. Restoration aborted.';
        END IF;
        
        -- Restore tables
        PERFORM restore_all_tables_from_backup();
        
        -- Restore triggers if the table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'backup' AND tablename = 'triggers_backup') THEN
            PERFORM restore_triggers_from_backup();
        ELSE
            RAISE NOTICE 'No triggers_backup table found, skipping trigger restoration.';
        END IF;
        
        -- Restore policies if the table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'backup' AND tablename = 'policies_backup') THEN
            PERFORM restore_policies_from_backup();
        ELSE
            RAISE NOTICE 'No policies_backup table found, skipping policy restoration.';
        END IF;
        
        RAISE NOTICE 'Database restoration completed successfully!';
    EXCEPTION WHEN OTHERS THEN
        -- Rollback the transaction on error
        RAISE NOTICE 'Error during restoration: %, rolling back', SQLERRM;
        -- Make sure triggers are re-enabled in case of errors
        BEGIN
            SET session_replication_role = 'origin';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not reset session_replication_role: %', SQLERRM;
        END;
        RAISE;
    END;
END;
$$; 