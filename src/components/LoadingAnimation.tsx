"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingAnimationProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function LoadingAnimation({ className = "w-24 h-24", style }: LoadingAnimationProps) {
  return (
    <div className={className} style={style}>
      <DotLottieReact
        src="https://lottie.host/695728f8-2a76-4d9b-97f8-b73789016c9e/O4frmddmlw.lottie"
        autoplay
        loop
        style={{ backgroundColor: "transparent", mixBlendMode: "multiply" }}
      />
    </div>
  );
}
