export default function OrdersPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <div className="rounded-full bg-muted p-6 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Quản lý Đơn hàng (Orders)</h2>
            <p className="text-muted-foreground max-w-md">
                Tính năng đang được phát triển. Sắp tới bạn sẽ có thể:
            </p>
            <ul className="mt-4 text-left text-sm text-muted-foreground list-disc pl-6 space-y-1 inline-block">
                <li>Đồng bộ đơn hàng từ Shopee, TikTok, Lazada.</li>
                <li>In vận đơn hàng loạt.</li>
                <li>Theo dõi trạng thái giao hàng thời gian thực.</li>
            </ul>
        </div>
    )
}
