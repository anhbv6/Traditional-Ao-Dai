"use client";

import { useState } from "react";
import { sendContactMessage } from "../api/contact.api";

export function useContact() {
  const [formData, setFormData] = useState({
    name: "",
    contactInfo: "",
    requestType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    setError(null);

    try {
      const response = await sendContactMessage(formData);
      if (response.success) {
        setIsSuccess(true);
        setFormData({ name: "", contactInfo: "", requestType: "", message: "" });
      } else {
        setError(response.message || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send message.");
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
