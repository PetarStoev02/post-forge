import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

type LoadingIndicatorProps = {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
}

const LoadingIndicator = ({ className, size = "sm" }: LoadingIndicatorProps) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Spinner className={sizeClasses[size]} />
    </div>
  )
}

export { LoadingIndicator }
