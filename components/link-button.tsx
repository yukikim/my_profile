import Link from "next/link";

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
};

export function LinkButton({ href, children }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className="
        inline-flex items-center justify-center
        rounded-xl bg-emerald-600 px-4 py-2
        text-sm font-semibold text-white
        transition-colors
        hover:bg-emerald-700
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-emerald-500
        focus-visible:ring-offset-2
      "
    >
      {children}
    </Link>
  );
}