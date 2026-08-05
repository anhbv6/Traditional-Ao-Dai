"use client";

import React from "react";
import { Toaster, resolveValue } from "react-hot-toast";
import { CheckCircle2, XCircle, Info, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      containerClassName="z-[9999]"
      toastOptions={{
        duration: 4000,
      }}
    >
      {(t) => {
        const resolvedMessage = resolveValue(t.message, t);

        const getIcon = () => {
          switch (t.type) {
            case "success":
              return <CheckCircle2 className="size-5 text-[#800020] dark:text-[#E8B4AC] shrink-0" />;
            case "error":
              return <XCircle className="size-5 text-destructive shrink-0" />;
            case "loading":
              return <Loader2 className="size-5 text-[#800020] dark:text-[#E8B4AC] animate-spin shrink-0" />;
            default:
              return <Info className="size-5 text-[#800020] dark:text-[#E8B4AC] shrink-0" />;
          }
        };

        return (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: t.visible ? 1 : 0,
              y: t.visible ? 0 : -20,
              scale: t.visible ? 1 : 0.95,
            }}
            transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white/90 dark:bg-[#1E1A1A]/95 backdrop-blur-md border border-[#800020]/15 dark:border-[#2D2625] px-5 py-4 shadow-xl select-none"
          >
            <div className="mt-0.5">{getIcon()}</div>
            
            <div className="flex-1 text-xs font-bold text-[#2A2525] dark:text-[#F7F4F0] font-[family-name:var(--font-lora)] leading-relaxed">
              {resolvedMessage}
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-[#706565] dark:text-[#A89F99] hover:text-[#800020] dark:hover:text-[#E8B4AC] transition-colors p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer outline-none border-none self-start"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        );
      }}
    </Toaster>
  );
}
