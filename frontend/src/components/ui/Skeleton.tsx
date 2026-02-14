import type { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-200", className)}
            {...props}
        />
    );
}