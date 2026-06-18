"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full secondary-bg py-16 md:py-24 relative overflow-hidden border-t border-zinc-200/60 z-10">
      {/* Background Watermark */}
      <div className="absolute right-[6%] bottom-[-22%] text-[22vw] font-bold text-zinc-200/30 select-none pointer-events-none uppercase tracking-tighter leading-none z-0">
        anima
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative z-10">
        {/* Top Footer Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12 pb-16">
          {/* Brand/Logo Column (2 cols on desktop) */}
          <div className="col-span-2 flex flex-col items-start gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl hover:opacity-95 transition-opacity"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <path
                  d="M0 6C0 2.68629 2.68629 0 6 0H18C21.3137 0 24 2.68629 24 6V18C24 21.3137 21.3137 24 18 24H6C2.68629 24 0 21.3137 0 18V6Z"
                  fill="#4DA2FF"
                />
                <path
                  d="M12 6.5C10.5 4.2 7.2 4.2 5.5 6.2C3.2 8.8 4.5 13.2 12 18.5C19.5 13.2 20.8 8.8 18.5 6.2C16.8 4.2 13.5 4.2 12 6.5Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polygon
                  points="6.5,8.5 17.5,8.5 16,11 12,12 8,11"
                  fill="white"
                />
                <path
                  d="M12 12V14.5M12 14.5L9.5 13.5M12 14.5L14.5 13.5M12 14.5V17"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="14.5" r="1" fill="white" />
                <circle cx="9.5" cy="13.5" r="0.8" fill="white" />
                <circle cx="14.5" cy="13.5" r="0.8" fill="white" />
                <circle cx="12" cy="17" r="0.8" fill="white" />
              </svg>

              <span className="font-bold text-lg text-white">
                Anima{" "}
                <span className="text-sm font-light text-white/40">Sui</span>
              </span>
            </Link>

            <p className="text-sm text-white font-light leading-relaxed max-w-[200px]">
              Native AI agent identity and autonomy protocol on the Sui network.
            </p>
          </div>

          {/* Col 2: Product */}
          <div className="flex flex-col gap-3">
            <span className="text-md font-semibold text-white tracking-wider uppercase mb-1">
              Product
            </span>
            <a
              href="#cta"
              className="text-sm text-white hover:text-black transition-colors"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="text-sm text-white hover:text-black transition-colors"
            >
              FAQs
            </a>
            <a
              href="/mint"
              className="text-sm text-white hover:text-black transition-colors"
            >
              Mint NFA
            </a>
          </div>

          {/* Col 3: Resources */}
          <div className="flex flex-col gap-3">
            <span className="text-md  font-semibold text-white tracking-wider uppercase mb-1">
              Resources
            </span>
            <a
              href="https://github.com/Anima-sui/ANIMA-protocol/tree/main/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              Docs <span className="text-[10px] opacity-75">↗</span>
            </a>
            <a
              href="https://github.com/Anima-sui/ANIMA-protocol/blob/main/docs/HOT_WALLET_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              Guides <span className="text-[10px] opacity-75">↗</span>
            </a>
            <a
              href="https://github.com/Anima-sui/ANIMA-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              GitHub <span className="text-[10px] opacity-75">↗</span>
            </a>
            <a
              href="https://github.com/Anima-sui/ANIMA-protocol/blob/main/docs/LITEPAPER.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              Litepaper <span className="text-[10px] opacity-75">↗</span>
            </a>
          </div>

          {/* Col 4: Built on */}
          <div className="flex flex-col gap-3">
            <span className="text-md font-semibold text-white tracking-wider uppercase mb-1">
              Built on
            </span>
            <a
              href="https://sui.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              Sui <span className="text-[10px] opacity-75">↗</span>
            </a>
            <a
              href="https://walrus.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              Walrus <span className="text-[10px] opacity-75">↗</span>
            </a>
            <a
              href="https://mystenlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-black transition-colors flex items-center gap-0.5"
            >
              Mysten Labs <span className="text-[10px] opacity-75">↗</span>
            </a>
          </div>

          {/* Col 5: Company */}
          <div className="flex flex-col gap-3">
            <span className="text-md font-semibold text-white tracking-wider uppercase mb-1">
              Company
            </span>
            <a
              href="#"
              className="text-sm text-white hover:text-black transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="text-sm text-white hover:text-black transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-white hover:text-black transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social Icons */}
          <div className="flex items-center gap-4 text-white">
            <a
              href="https://x.com/AnimaSui"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
              aria-label="X"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <a
              href="https://github.com/Anima-sui/ANIMA-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
              aria-label="GitHub"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.598 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>

          {/* Copyright Note */}
          <p className="text-sm text-white font-light">
            © 2026 ANIMA Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
