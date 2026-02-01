export default function InventoryPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <div className="rounded-full bg-muted p-6 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Quản lý Tồn kho (Inventory)</h2>
            <p className="text-muted-foreground max-w-md">
                Tính năng đang được phát triển. Sắp tới bạn sẽ có thể:
            </p>
            <ul className="mt-4 text-left text-sm text-muted-foreground list-disc pl-6 space-y-1 inline-block">
                <li>Đồng bộ tồn kho đa kênh tự động.</li>
                <li>Cảnh báo sắp hết hàng.</li>
                <li>Quản lý nhiều kho hàng vật lý.</li>
            </ul>
        </div>
    )
}
