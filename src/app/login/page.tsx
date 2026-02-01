"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Command } from "lucide-react"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    async function onGoogleSignIn() {
        setIsLoading(true)
        await signIn("google", { callbackUrl: "/" })
    }

    async function onCredentialsSignIn(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        // Note: For credentials, we typically use the server action or api, 
        // but next-auth/react signIn handles it client-side too.
        await signIn("credentials", {
            email,
            password,
            callbackUrl: "/"
        })
        setIsLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md px-4">
                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Command className="size-6" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">TitanOPS</h1>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
                        <CardDescription>
                            Chọn phương thức đăng nhập để truy cập hệ thống quản lý.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button variant="outline" onClick={onGoogleSignIn} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                            )}
                            Đăng nhập bằng Google
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">
                                    Hoặc đăng nhập bằng Email
                                </span>
                            </div>
                        </div>
                        <form onSubmit={onCredentialsSignIn} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Đăng nhập
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <div className="text-center text-sm text-muted-foreground w-full">
                            Chưa có tài khoản?{" "}
                            <span className="underline underline-offset-4 hover:text-primary cursor-pointer">
                                Liên hệ Admin
                            </span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
