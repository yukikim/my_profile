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
    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
    <button
      type="button"
      onClick={() => setIsMenuOpen((current) => !current)}
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
      aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={isMenuOpen}
      aria-controls="mobile-menu"
    >
      {isMenuOpen ? (
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      )}
    </button>
    {/* スマートフォン向けメニュー */}
      {isMenuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-gray-200 bg-white/90 px-4 py-4 md:hidden"
          aria-label="スマートフォンメニュー"
        >
          <div className="flex flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-md px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600"
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
