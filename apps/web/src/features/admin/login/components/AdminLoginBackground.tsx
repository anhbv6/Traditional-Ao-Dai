import React from "react";

export function AdminLoginBackground() {
  return (
    <>
      {/* Floating Animated Background Blobs for depth (preserved) */}
      <div className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-teal-200/20 mix-blend-multiply filter blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[65vw] h-[65vw] rounded-full bg-cyan-200/15 mix-blend-multiply filter blur-[130px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-[25%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-sky-200/15 mix-blend-multiply filter blur-[100px] animate-float-slow pointer-events-none" />

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
    </>
  );
}
