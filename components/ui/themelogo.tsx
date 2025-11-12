"use client"

import { useTheme } from "next-themes"
import Image from 'next/image'

export function ThemeLogo() {
    const { resolvedTheme } = useTheme()

    return (
        <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg" >
            <Image
                suppressHydrationWarning
                src={resolvedTheme === 'dark'
                    ? "/1bgrmvd.png"
                    : "/2bgrmvd.png"}
                alt="SS Logo"
                width={80}
                height={80}
                className="size-15 rounded-lg object-cover"
            />
        </div>
    )
}