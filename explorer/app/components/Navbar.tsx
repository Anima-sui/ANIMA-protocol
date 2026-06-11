"use client";

import React, { useState } from "react";
import { Menu, Wifi } from "lucide-react";

const Navbar = () => {
  const [isBlockchainOpen, setIsBlockchainOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className="z-20 flex items-center px-2 sm:px-8 md:px-12 text-sm font-medium"
      style={{ height: "72px" }}
    >
      {/* Logo and Brand */}
      <a className="flex items-center" href="/">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-6 w-6"
        >
          <path
            d="M0 6C0 2.68629 2.68629 0 6 0H18C21.3137 0 24 2.68629 24 6V18C24 21.3137 21.3137 24 18 24H6C2.68629 24 0 21.3137 0 18V6Z"
            fill="#4DA2FF"
          ></path>
          <path
            d="M6.99748 5.28362L6.99748 11.0148L8.71768 12.0008L6.99731 12.987L6.99731 18.7182L11.9972 21.584L16.9971 18.7182L16.9971 12.9866L15.2769 12.0007L16.9973 11.0147L16.9973 5.28308L11.997 2.41732L6.99748 5.28362ZM11.6464 3.42366L11.6464 7.94789L7.69961 10.2105L7.69961 5.68623L11.6464 3.42366ZM12.3482 20.5781L12.3482 16.0535L16.2954 13.7912L16.2954 18.3159L12.3482 20.5781ZM15.9441 13.1879L11.9973 15.4501L8.05048 13.1879L9.41994 12.4031L11.9973 13.8803L14.575 12.4031L15.9441 13.1879ZM11.9973 10.1208L9.41964 11.5982L8.05048 10.8134L11.9973 8.55113L15.9445 10.8134L14.575 11.5982L11.9973 10.1208Z"
            fill="white"
          ></path>
        </svg>
        <span className="font-bold text-lg">
          Anima <span className="text-sm font-light">Explorer</span>
        </span>
      </a>

      {/* Navigation - Desktop */}
      <nav className="ml-8 hidden md:flex max-header2:ml-4">
        {/* Blockchain Dropdown */}
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsBlockchainOpen(!isBlockchainOpen)}
            className="flex cursor-pointer items-center rounded px-3 py-2 text-sm hover:text-brand"
          >
            Home
          </button>
        </div>

        {/* Validators Link */}
        <a className="rounded px-3 py-2 hover:text-brand" href="/nfa">
          Agents {`(NFAs)`}
        </a>

        {/* Coins Link */}
        <a className="rounded px-3 py-2 hover:text-brand" href="/coins">
          Coins
        </a>
      </nav>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-x-2 md:gap-x-3">
        {/* Connect Wallet Button - Hidden on small screens */}
        <button className="hidden sm:inline-flex items-center primary-button gap-2 rounded-full cursor-pointer hover:scale-95 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg">
          Connect wallet
        </button>

        {/* Theme Toggle Button */}
        <div className="pointer-events-auto  bg-[#6fa0ff]/15 px-4 py-2 rounded-full">
          <Wifi className="inline-block text-green-400 h-4 w-4 mr-0.5 mb-0.5" />{" "}
          Testnet
        </div>

        {/* Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="cursor-pointer bg-body p-2"
          >
            <Menu className="w-8 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-[72px] left-0 right-0 bg-page md:hidden border-b shadow-lg">
          <nav className="flex flex-col px-4 py-4 gap-y-2">
            <button
              onClick={() => setIsBlockchainOpen(!isBlockchainOpen)}
              className="flex cursor-pointer items-center rounded px-3 py-2 text-sm hover:text-brand text-left w-full"
            >
              Home
            </button>
            <a
              className="rounded px-3 py-2 hover:text-brand text-sm block"
              href="/nfa"
            >
              Agents {`(NFAs)`}
            </a>

            <a className="rounded px-3 py-2 hover:text-brand" href="/coins">
              Coins
            </a>

            <button className="w-full primary-button inline-flex items-center justify-center gap-2 rounded-full cursor-pointer hover:scale-95 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg mt-2">
              Connect wallet
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
