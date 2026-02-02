
export default function DebugPage() {
    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold text-green-600">Debug Page is Working!</h1>
            <p>System Time: {new Date().toISOString()}</p>
            <p>If you see this, the Vercel deployment is active and serving content.</p>
        </div>
    )
}
