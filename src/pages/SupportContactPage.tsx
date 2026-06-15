import { Clock3, Headset, Mail, MessageCircleMore, Phone } from "lucide-react";
import UserShell from "../layouts/UserShell";

export default function SupportContactPage() {
  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-[#efefef] p-5 sm:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/50 p-6 min-h-[260px]">
              <div className="absolute -left-14 -top-14 h-44 w-44 rounded-full bg-orange-100/80" />
              <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-blue-100/80" />
              <div className="relative flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  <Headset className="h-10 w-10" />
                </span>
                <p className="mt-5 text-lg font-semibold text-slate-700">ROOMIE Support Team</p>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Luôn sẵn sàng đồng hành và hỗ trợ bạn trong quá trình đăng tin, tìm phòng và kết nối ở ghép.
                </p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <Headset className="mx-auto h-7 w-7 text-slate-800 lg:mx-0" />
              <h1 className="mt-3 text-3xl font-bold text-slate-900">Hỗ trợ chủ nhà đăng tin</h1>
              <p className="mt-4 text-xl text-slate-700">Nếu bạn cần hỗ trợ đăng tin, vui lòng liên hệ số điện thoại bên dưới:</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="tel:0842494586"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6a3d] px-6 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-[#e65a2f]"
                >
                  <Phone className="h-5 w-5" />
                  DT: 0842494586
                </a>
                <a
                  href="https://zalo.me/0704542270"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <MessageCircleMore className="h-5 w-5" />
                  Zalo: 0704542270
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(255,120,0,0.45)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Thông tin chi tiết</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">Liên hệ hỗ trợ ROOMIE</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <a href="mailto:support.roomie@gmail.com" className="mt-1 block text-sm font-semibold text-slate-800 hover:text-orange-600">
                support.roomie@gmail.com
              </a>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <MessageCircleMore className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Zalo</p>
              <a
                href="https://zalo.me/0704542270"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-semibold text-slate-800 hover:text-blue-600"
              >
                0704542270
              </a>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <Clock3 className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Thời gian hỗ trợ</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">8:00 - 20:00</p>
            </div>
          </div>
        </section>
      </div>
    </UserShell>
  );
}