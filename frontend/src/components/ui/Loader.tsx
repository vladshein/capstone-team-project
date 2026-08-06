interface LoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function Loader({
  label = "Завантаження…",
  size = "md",
  fullScreen = false,
}: LoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-[60vh] items-center justify-center bg-bg px-4"
          : "flex items-center justify-center py-6"
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className={`animate-spin rounded-full border-border border-t-accent ${sizeClasses[size]}`}
        />
        <span className="text-sm text-text-muted">{label}</span>
      </div>
    </div>
  );
}

export default Loader;
