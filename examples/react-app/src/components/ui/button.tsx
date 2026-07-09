import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        destructive: "bg-red-600 text-slate-50 hover:bg-red-600/90",
        outline: "border border-slate-200 bg-transparent hover:bg-slate-100",
        ghost: "bg-transparent hover:bg-slate-100",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Stretch the button to fill its container. @default false */
  fullWidth?: boolean;
}

/** A button. Supports visual variants and sizes via cva. */
export function Button({
  className,
  variant,
  size,
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
