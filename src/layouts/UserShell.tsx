import type { PropsWithChildren } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function UserShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-10">{children}</main>

      <Footer />
    </div>
  );
}
