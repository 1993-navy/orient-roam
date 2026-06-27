// X-style button component with smooth transitions and feedback
import { ButtonHTMLAttributes, forwardRef } from "react";

export const XButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
  }
>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      primary:
        "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md active:scale-[0.97] dark:bg-rose-600 dark:hover:bg-rose-700",
      secondary:
        "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-md active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
      ghost:
        "text-neutral-700 hover:bg-neutral-100 active:scale-[0.97] dark:text-neutral-200 dark:hover:bg-neutral-800",
      danger:
        "bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-[0.97] dark:bg-red-600 dark:hover:bg-red-700",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-4 py-2 text-sm rounded-xl",
      lg: "px-6 py-3 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

XButton.displayName = "XButton";