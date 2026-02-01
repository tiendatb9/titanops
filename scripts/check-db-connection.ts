
import { Client } from 'pg'

// Load env
if (process.env.NODE_ENV !== 'production') {
    try { process.loadEnvFile() } catch (e) {
        console.log('No .env file loaded or error loading it')
    }
}

const poolerUrl = process.env.DATABASE_URL
const directUrl = process.env.DIRECT_URL || poolerUrl?.replace(':6543', ':5432').replace('aws-1-ap-south-1.pooler.supabase.com', 'db.atzogkbenmbijcswfazs.supabase.co').replace('postgres.atzogkbenmbijcswfazs', 'postgres').split('?')[0]

async function testConnection(name: string, connectionString: string | undefined) {
    if (!connectionString) {
        console.log(`[${name}] No connection string found.`)
        return
    }
    console.log(`[${name}] Testing connection to... ${connectionString.split('@')[1] || 'invalid-url'}`)

    // Set a short timeout
    const client = new Client({
        connectionString,
        connectionTimeoutMillis: 5000
    })

    try {
        await client.connect()
        const res = await client.query('SELECT NOW()')
        console.log(`[${name}] SUCCESS! Connected. Time: ${res.rows[0].now}`)
        await client.end()
        return true
    } catch (e: any) {
        console.log(`[${name}] FAILED: ${e.message}`)
        return false
    }
}

async function main() {
    console.log('--- STARTING DIAGNOSTIC ---')
    console.log('Project ID detected (from previous errors): atzogkbenmbijcswfazs')

    // Test Pooler
    await testConnection('POOLER (6543)', poolerUrl)

    // Test Direct (Guessed/Configured)
    await testConnection('DIRECT (5432)', directUrl)

    console.log('--- END DIAGNOSTIC ---')
}

main()
