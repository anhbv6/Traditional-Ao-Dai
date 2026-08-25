"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { showToast as toast } from "@/components/ui/toast";

export function AdminLoginForm() {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Mật khẩu phải chứa ít nhất 6 ký tự!");
      return;
    }

    setIsLoading(true);

    // Simulate login loading state
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Đăng nhập quản trị viên thành công!");
      router.push(`/${locale}/admin/dashboard`);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-[family-name:var(--font-geist-sans)] animate-pastel-flow px-4 py-12 select-none">
      
      {/* Floating Animated Background Blobs for depth */}
      <div className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-teal-200/20 mix-blend-multiply filter blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[65vw] h-[65vw] rounded-full bg-cyan-200/15 mix-blend-multiply filter blur-[130px] animate-float-delayed" />
      <div className="absolute top-[25%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-sky-200/15 mix-blend-multiply filter blur-[100px] animate-float-slow" />

      {/* Inline styles for custom keyframe animations */}
      <style>{`
        @keyframes pastel-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-pastel-flow {
          background: linear-gradient(-45deg, #FFDEE9, #B5FFFC, #ECE9E6, #D8E2DC, #FFE5EC, #D6E2E9);
          background-size: 400% 400%;
          animation: pastel-gradient 18s ease infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.03); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) scale(1.03); }
          50% { transform: translateY(30px) scale(0.97); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 12s ease-in-out infinite;
        }
      `}</style>

      {/* Centered White Card (High-Fashion Monochromatic Aesthetics) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-[440px] bg-white border border-[#E4E4E7] rounded-2xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] z-10"
      >
        {/* Header Block */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#09090B] mt-1.5">
            Login
          </h2>
        </div>

        {/* Input Fields Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email address field */}
          <div className="space-y-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-3 border border-[#E4E4E7] rounded-lg text-sm text-[#09090B] placeholder-[#71717A]/50 bg-white outline-none focus:border-[#09090B] focus:ring-1 focus:ring-[#09090B] transition-all font-normal"
              required
            />
          </div>

          {/* Password field */}
          <div className="relative space-y-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 pr-10 border border-[#E4E4E7] rounded-lg text-sm text-[#09090B] placeholder-[#71717A]/50 bg-white outline-none focus:border-[#09090B] focus:ring-1 focus:ring-[#09090B] transition-all font-normal"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#09090B] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-end text-xs sm:text-sm text-[#71717A] pt-1">
            {/* <label className="flex items-center gap-2 cursor-pointer select-none group font-normal text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B] cursor-pointer"
              />
              <span className="group-hover:text-[#09090B] transition-colors">Remember for 30 days</span>
            </label> */}
            <button
              type="button"
              onClick={() => toast("Chức năng khôi phục mật khẩu đang được xử lý.")}
              className="text-[#09090B] font-semibold hover:underline cursor-pointer"
            >
              Forgot password
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#18181B] hover:bg-[#09090B] text-white py-3 rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                "Login in"
              )}
            </button>
          </div>

          {/* Footer Account Link */}
          <div className="text-sm text-[#71717A] text-center pt-2">
            Have a good day! ^^
          </div>
        </form>
      </motion.div>

    </div>
  );
}
