"use client";

import React from "react";
import toast, { ToastOptions } from "react-hot-toast";

export const showToast = {
  success: (message: string, description?: string, options?: ToastOptions) => {
    return toast.success(
      description ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">{message}</span>
          <span className="text-[10px] font-normal text-[#706565] dark:text-[#A89F99]">{description}</span>
        </div>
      ) : (
        message
      ),
      options
    );
  },
  error: (message: string, description?: string, options?: ToastOptions) => {
    return toast.error(
      description ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">{message}</span>
          <span className="text-[10px] font-normal text-rose-500/80 dark:text-rose-400/80">{description}</span>
        </div>
      ) : (
        message
      ),
      options
    );
  },
  info: (message: string, description?: string, options?: ToastOptions) => {
    // react-hot-toast uses generic toast for custom/info type
    return toast(
      description ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">{message}</span>
          <span className="text-[10px] font-normal text-[#706565] dark:text-[#A89F99]">{description}</span>
        </div>
      ) : (
        message
      ),
      {
        ...options,
        icon: undefined, // Let the ToastProvider render standard Info icon
      }
    );
  },
  loading: (message: string, description?: string, options?: ToastOptions) => {
    return toast.loading(
      description ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">{message}</span>
          <span className="text-[10px] font-normal text-[#706565] dark:text-[#A89F99]">{description}</span>
        </div>
      ) : (
        message
      ),
      options
    );
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, options);
  },
  dismiss: (id?: string) => {
    toast.dismiss(id);
  },
};
