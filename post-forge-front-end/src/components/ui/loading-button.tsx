import * as React from "react"

import type { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type LoadingButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

const LoadingButton = ({
  children,
  loading = false,
  disabled,
  className,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </Button>
  )
}

export { LoadingButton }
