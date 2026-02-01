
import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

// Load env
if (process.env.NODE_ENV !== 'production') {
    try { process.loadEnvFile() } catch (e) { }
}

const connectionString = process.env.DATABASE_URL // Pooler 6543

async function main() {
    console.log('--- MANUAL MIGRATION START ---')
    console.log('Target:', connectionString?.split('@')[1])

    const client = new Client({ connectionString })
    await client.connect()

    try {
        const sqlPath = path.join(process.cwd(), 'prisma', 'init_schema.sql')
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

        console.log('Loaded SQL script. Executing...')

        // Basic split by ; is risky for functions/triggers but okay for basic Schema create
        // Supabase Postgres usually handles big blocks okay.

        // Remove Transaction Begin/Commit if present as we might not want nested transaction issues with pooler?
        // Actually pg driver runs in implicit transaction usually unless specified.

        await client.query(sqlContent)
        console.log('SUCCESS: Schema applied successfully.')

    } catch (e) {
        console.error('MIGRATION FAILED:', e)
    } finally {
        await client.end()
        console.log('--- MANUAL MIGRATION END ---')
    }
}

main()
