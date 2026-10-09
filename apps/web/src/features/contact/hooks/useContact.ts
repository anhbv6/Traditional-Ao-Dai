"use client";

import { useState } from "react";
import { resolveErrorMessage } from "@/lib/messages";
import { sendContactMessage } from "../api/contact.api";
import type { ContactFormValues } from "../types/contact.types";

const EMPTY_FORM: ContactFormValues = {
  name: "",
  contactInfo: "",
  requestType: "",
  message: "",
};

export function useContact() {
  const [formData, setFormData] = useState<ContactFormValues>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <K extends keyof ContactFormValues>(field: K, value: ContactFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    setError(null);

    try {
      await sendContactMessage(formData);
      setIsSuccess(true);
      setFormData(EMPTY_FORM);
    } catch (err: unknown) {
      setError(resolveErrorMessage(err, "sendError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isSuccess,
    error,
    handleChange,
    handleSubmit,
  };
}
