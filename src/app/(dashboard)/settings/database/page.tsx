"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Database, Lock, ShieldCheck, Save, CheckCircle2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

enum StorageMode {
    TITAN_CLOUD = "TITAN_CLOUD",
    PRIVATE_DB = "PRIVATE_DB"
}

const dbSettingsSchema = z.object({
    storageMode: z.nativeEnum(StorageMode).default(StorageMode.TITAN_CLOUD),
    privateDbUrl: z.string().default(""),
    privateApiKey: z.string().default(""),
}).superRefine((data, ctx) => {
    if (data.storageMode === StorageMode.PRIVATE_DB) {
        if (!data.privateDbUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập URL kết nối Supabase/Postgres",
                path: ["privateDbUrl"]
            })
        }
        if (!data.privateApiKey) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập Private/Anon Key",
                path: ["privateApiKey"]
            })
        }
    }
})

type DbSettingsValues = z.infer<typeof dbSettingsSchema>

export default function DatabaseSettingsPage() {
    const form = useForm<DbSettingsValues>({
        resolver: zodResolver(dbSettingsSchema) as any,
        defaultValues: {
            storageMode: StorageMode.TITAN_CLOUD,
            privateDbUrl: "",
            privateApiKey: "",
        },
    })

    function onSubmit(data: DbSettingsValues) {
        console.log("Saving Database Settings:", data)
        // Mock API Call
        alert("Đã lưu cấu hình database thành công!")
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Cấu hình Database</h3>
                <p className="text-sm text-muted-foreground">
                    Chọn nơi lưu trữ dữ liệu khách hàng & đơn hàng của bạn.
                </p>
            </div>
            <Separator />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="storageMode"
                        render={({ field }) => (
                            <div className="space-y-4">
                                <Tabs
                                    onValueChange={(val) => field.onChange(val as StorageMode)}
                                    defaultValue={field.value}
                                    className="w-full max-w-3xl"
                                >
                                    <TabsList className="grid w-full grid-cols-2 h-14">
                                        <TabsTrigger value={StorageMode.TITAN_CLOUD} className="h-full gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 border border-transparent">
                                            <ShieldCheck className="h-5 w-5" />
                                            <div className="text-left">
                                                <div className="font-semibold">Titan Cloud (Managed)</div>
                                                <div className="text-xs opacity-80 text-muted-foreground">Mặc định - An toàn & Tiện lợi</div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value={StorageMode.PRIVATE_DB} className="h-full gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 border border-transparent">
                                            <Database className="h-5 w-5" />
                                            <div className="text-left">
                                                <div className="font-semibold">Private Database (BYOD)</div>
                                                <div className="text-xs opacity-80 text-muted-foreground">Supabase / PostgreSQL</div>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="mt-6 space-y-6">
                                        <TabsContent value={StorageMode.TITAN_CLOUD} className="m-0 animate-in fade-in slide-in-from-top-2">
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 flex items-start gap-4">
                                                <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />
                                                <div>
                                                    <h4 className="font-medium tracking-tight">Được quản lý hoàn toàn bởi TitanOPS</h4>
                                                    <div className="text-sm text-green-700 mt-1">
                                                        Dữ liệu của bạn được mã hóa 2 lớp (Encryption At Rest) và được sao lưu hàng ngày.
                                                        <br />
                                                        Bạn không cần phải lo lắng về việc duy trì server hay database.
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value={StorageMode.PRIVATE_DB} className="m-0 animate-in fade-in slide-in-from-top-2">
                                            <Card className="border-purple-200 bg-purple-50/20">
                                                <CardHeader>
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Lock className="h-4 w-4 text-purple-600" />
                                                        Thông tin kết nối Supabase / Postgres
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Kết nối trực tiếp vào Database của bạn. TitanOPS sẽ đọc/ghi dữ liệu thông qua Client này.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="privateDbUrl"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Database URL / Supabase URL</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="https://xyz.supabase.co" className="bg-white" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    URL của project Supabase hoặc Connection String của Postgres.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="privateApiKey"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>API Key (Service Role / Anon)</FormLabel>
                                                                <FormControl>
                                                                    <Input type="password" placeholder="eyJh..." className="bg-white" {...field} />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Khuyên dùng Service Role Key để có quyền ghi đầy đủ.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        )}
                    />

                    <Button type="submit" className="w-[200px]">
                        <Save className="mr-2 h-4 w-4" /> Lưu cấu hình
                    </Button>
                </form>
            </Form>
        </div>
    )
}
