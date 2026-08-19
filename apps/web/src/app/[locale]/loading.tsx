import { SpinnerCustom } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <SpinnerCustom />
        <span className="text-sm font-medium text-neutral-500 animate-pulse">
          Loading...
        </span>
      </div>
    </div>
  )
}
