"use client";

import { useState } from "react";
import Link from "next/link";

interface MobileMenuProps {
  navigation: { label: string; href: string }[];
}

export function MobileMenu({ navigation }: MobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  return (
    <div className="relative flex flex-col items-end md:hidden">
      <button
        type="button"
        onClick={() => setIsMenuOpen((current) => !current)}
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-teal-100 px-4 text-xs font-semibold tracking-wide text-teal-800 transition hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        {isMenuOpen ? "CLOSE" : "MENU"}
      </button>
      {/* スマートフォン向けメニュー */}
      {isMenuOpen && (
        <nav
          id="mobile-menu"
          className="absolute top-12 right-0 w-64 rounded-3xl border border-teal-200 bg-white/95 p-3 shadow-[var(--bright-shadow-floating)] backdrop-blur"
          aria-label="スマートフォンメニュー"
        >
          <div className="flex flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
