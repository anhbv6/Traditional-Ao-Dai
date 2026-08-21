"use client";

import { useState } from "react";

export function useSetting() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccessPass, setShowSuccessPass] = useState(false);

  const [notifPromo, setNotifPromo] = useState(true);
  const [notifOrder, setNotifOrder] = useState(true);
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    setShowSuccessPass(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setShowSuccessPass(false), 3000);
  };

  const handleNotifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessNotif(true);
    setTimeout(() => setShowSuccessNotif(false), 3000);
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    showSuccessPass,
    notifPromo,
    setNotifPromo,
    notifOrder,
    setNotifOrder,
    showSuccessNotif,
    handlePasswordSubmit,
    handleNotifSubmit,
  };
}
