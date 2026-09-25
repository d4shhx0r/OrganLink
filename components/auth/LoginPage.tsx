"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthMethodSelector } from "./AuthMethodSelector";
import { LoginForm } from "./LoginForm";

type AuthMode = "select" | "credentials";

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("select");

  const variants = {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <main className="min-h-screen w-full bg-white flex flex-col justify-between items-center px-4 py-8 sm:px-6 md:px-8 select-none">
      {/* Top spacing spacer */}
      <div className="w-full h-8 sm:h-12" aria-hidden="true" />

      {/* Main Centered Content Container (~380px width) */}
      <div className="w-full max-w-[380px] mx-auto my-auto flex flex-col items-center">
        <AnimatePresence mode="wait">
          {mode === "select" ? (
            <motion.div
              key="auth-select"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <AuthMethodSelector
                onSelectEmail={() => setMode("credentials")}
                appName="OrganLink"
              />
            </motion.div>
          ) : (
            <motion.div
              key="auth-credentials"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <LoginForm
                onBack={() => setMode("select")}
                appName="OrganLink"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Minimal Footer */}
      <footer className="w-full py-4 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-[#9CA3AF]">
          <span>OrganLink v1.0</span>
          <span>•</span>
          <span>HIPAA &amp; GDPR Compliant Architecture</span>
          <span>•</span>
          <span>Protected by 256-bit SSL</span>
        </div>
      </footer>
    </main>
  );
}
