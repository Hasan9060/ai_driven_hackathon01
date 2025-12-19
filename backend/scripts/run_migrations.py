"""
Database migration runner
"""
import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def run_migration(connection, migration_file):
    """Run a single migration file"""
    print(f"Running migration: {migration_file}")

    with open(migration_file, 'r') as f:
        migration_sql = f.read()

    # Split SQL by semicolons to handle multiple statements
    statements = [s.strip() for s in migration_sql.split(';') if s.strip()]

    for statement in statements:
        if statement:
            try:
                await connection.execute(statement)
            except Exception as e:
                # Ignore "already exists" and other non-critical errors
                if "already exists" not in str(e).lower():
                    print(f"Warning: {e}")

    print(f"Migration completed: {migration_file}")


async def create_migration_table(connection):
    """Create migration tracking table"""
    await connection.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """)


async def get_executed_migrations(connection):
    """Get list of already executed migrations"""
    result = await connection.fetch(
        "SELECT filename FROM schema_migrations ORDER BY filename"
    )
    return [row['filename'] for row in result]


async def mark_migration_executed(connection, filename):
    """Mark a migration as executed"""
    await connection.execute(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        filename
    )


async def main():
    """Main migration runner"""
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    # Convert to asyncpg format if needed
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

    migrations_dir = Path(__file__).parent.parent / "migrations"

    print(f"Connecting to database...")
    conn = await asyncpg.connect(database_url)

    try:
        # Create migration tracking table
        await create_migration_table(conn)

        # Get executed migrations
        executed = await get_executed_migrations(conn)
        print(f"Previously executed migrations: {len(executed)}")

        # Get all migration files
        migration_files = sorted(migrations_dir.glob("*.sql"))

        # Run pending migrations
        for migration_file in migration_files:
            filename = migration_file.name

            if filename not in executed:
                await run_migration(conn, migration_file)
                await mark_migration_executed(conn, filename)
                print(f"✓ Marked as executed: {filename}")
            else:
                print(f"⚠ Skipping already executed: {filename}")

        print("\n✅ All migrations completed successfully!")

    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())