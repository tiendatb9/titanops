
import { Client } from 'pg'
import bcrypt from 'bcryptjs'

// Load env
if (process.env.NODE_ENV !== 'production') {
    try { process.loadEnvFile() } catch (e) { }
}

async function main() {
    let connectionString = process.env.DATABASE_URL

    // Hack to extract real postgres URL from prisma+postgres proxy URL if needed
    // The format in .env was prisma+postgres://...?api_key=BASE64
    // We try to decode it.
    if (connectionString?.startsWith('prisma+postgres://')) {
        try {
            const urlObj = new URL(connectionString)
            const apiKey = urlObj.searchParams.get('api_key')
            if (apiKey) {
                const decoded = Buffer.from(apiKey, 'base64').toString('utf-8')
                const json = JSON.parse(decoded)
                if (json.databaseUrl) {
                    console.log('Found Direct URL from API Key')
                    connectionString = json.databaseUrl
                }
            }
        } catch (e) {
            console.error('Failed to parse prisma+postgres URL', e)
        }
    }

    console.log('Connecting to:', connectionString?.split('@')[1]) // Log host only safely

    const client = new Client({ connectionString })
    await client.connect()

    try {
        const email = 'admin@titanops.com'
        const hashedPassword = await bcrypt.hash('admin123', 10)
        const id = 'user_admin_seed_' + Date.now() // Simple ID
        const now = new Date().toISOString()

        // Check exist
        const res = await client.query('SELECT id FROM "User" WHERE email = $1', [email])

        if (res.rows.length > 0) {
            console.log('User already exists:', res.rows[0])
            // Update password just in case
            await client.query('UPDATE "User" SET password = $1 WHERE email = $2', [hashedPassword, email])
            console.log('Password updated')
        } else {
            // Insert
            await client.query(`
                INSERT INTO "User" (id, email, name, password, plan, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [id, email, 'Admin User', hashedPassword, 'BUSINESS', now, now])
            console.log('User created')
        }

    } catch (e) {
        console.error('Error executing query', e)
    } finally {
        await client.end()
    }
}

main()
