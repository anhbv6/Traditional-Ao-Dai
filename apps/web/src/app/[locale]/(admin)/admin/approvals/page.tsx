export const dynamic = "force-dynamic";

import { AdminApprovalsList } from "@/features/admin";

export default function AdminApprovalsPage() {
  return (
    <div className="mx-auto max-w-[1440px] w-full px-5 sm:px-8 lg:px-12 py-8">
      <AdminApprovalsList />
    </div>
  );
}
