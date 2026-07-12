import type { WarhomeAdminRole } from "@/lib/warhome/auth";
import { WarhomeHeader } from "./WarhomeHeader";
import { WarhomeSidebar } from "./WarhomeSidebar";

type WarhomeShellProps = {
  role: WarhomeAdminRole;
  children: React.ReactNode;
};

export function WarhomeShell({ role, children }: WarhomeShellProps) {
  return (
    <div className="min-h-screen bg-[#091422] text-slate-100">
      <WarhomeSidebar role={role} />
      <div className="min-h-screen md:pl-20 lg:pl-64">
        <WarhomeHeader role={role} />
        <main className="px-5 py-7 sm:px-7 sm:py-9 lg:px-9 xl:px-11">{children}</main>
      </div>
    </div>
  );
}
