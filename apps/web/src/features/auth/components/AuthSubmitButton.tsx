import React from 'react';
import { ActionButton, type ActionButtonProps } from '@/components/shared/ActionButton';

/** Nút hành động chính của form auth — ActionButton `confirm` cỡ `md`, full width (cao bằng ô nhập TextField `md`) */
export function AuthSubmitButton({ type = 'submit', ...props }: ActionButtonProps) {
  return <ActionButton type={type} variant="confirm" size="md" fullWidth iconPosition="end" {...props} />;
}

export default AuthSubmitButton;
