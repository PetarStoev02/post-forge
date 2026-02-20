import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

type PageLoaderProps = {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
}

const PageLoader = ({ className, size = "lg" }: PageLoaderProps) => {
  return (
    <div className={cn("flex flex-1 items-center justify-center", className)}>
      <Spinner className={sizeClasses[size]} />
    </div>
  )
}

export { PageLoader }
