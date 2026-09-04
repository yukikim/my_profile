type LoadingCircleProps = {
  label?: string;
};

export function LoadingCircle({ label = "読み込み中…" }: LoadingCircleProps) {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-5 py-12"
    >
      <span
        aria-hidden="true"
        className="size-12 rounded-full border-4 border-teal-100 border-t-teal-600 motion-safe:animate-spin"
      />
      <span className="text-sm text-teal-700">{label}</span>
    </div>
  );
}
