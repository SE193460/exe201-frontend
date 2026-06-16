import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/services/auth";
import { fetchAdminDashboard, type AdminDashboardSummary } from "../../api/services/admin";
import Sidebar from "../../components/Sidebar";

const quickLinks = [
  {
    title: "Quản lý người dùng",
    description: "Xem danh sách tài khoản, trạng thái hoạt động.",
    path: "/admin/users",
    accent: "bg-orange-100 text-orange-700",
  },
  {
    title: "Quản lý bài đăng",
    description: "Duyệt và kiểm soát bài đăng phòng ở ghép.",
    path: "/admin/listings",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "Quản lý tiện nghi",
    description: "Tạo, cập nhật tiện nghi hiển thị cho bài đăng.",
    path: "/admin/amenities",
    accent: "bg-rose-100 text-rose-700",
  },
  {
    title: "Quản lý thanh toán",
    description: "Xem lịch sử giao dịch và thanh toán",
    path: "/admin/payments",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    title: "Báo cáo hệ thống",
    description: "Xem danh sách báo cáo từ người dùng",
    path: "/admin/reports",
    accent: "bg-red-100 text-red-700",
  },
];

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN") + " đ";
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function buildSparklinePath(values: number[], width = 160, height = 52) {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? 1 : max - min;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

type ChartHoverHandler = (event: MouseEvent<SVGElement>, label: string) => void;

function filterDailyLabels(labels: string[]): string[] {
  if (labels.length === 0) return [];
  const keysToShow = new Set(['1', '5', '10', '15', '20', '25', labels[labels.length - 1]]);
  return labels.map((label) => (keysToShow.has(label) ? label : ''));
}

function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function renderChartGrid(values: number[], width = 320, height = 130, isCurrency = false, labels: string[] = []) {
  const max = Math.max(...values, 0);
  const lines = [0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: height - fraction * height,
    label: isCurrency ? formatCurrency(Math.round(max * fraction)) : formatNumber(Math.round(max * fraction)),
  }));
  const tickPoints = values.map((_, index) => ({
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
  }));

  return (
    <g opacity="0.45">
      <line x1="0" x2="0" y1="0" y2={height} stroke="#94a3b8" strokeWidth="1" />
      <line x1="0" x2={width} y1={height} y2={height} stroke="#94a3b8" strokeWidth="1" />
      {lines.map((line) => (
        <g key={`grid-${line.y}`}> 
          <line x1="0" x2={width} y1={line.y} y2={line.y} stroke="#94a3b8" strokeWidth="1" />
          <text x="4" y={line.y - 6} fill="#475569" fontSize="10" fontWeight="500">
            {line.label}
          </text>
        </g>
      ))}
      {tickPoints.map((tick, index) => (
        <g key={`tick-${index}`}> 
          <line x1={tick.x} x2={tick.x} y1={height} y2={height - 6} stroke="#94a3b8" strokeWidth="1" />
          {labels[index] ? (
            <text x={tick.x} y={height + 14} fill="#475569" fontSize="10" fontWeight="500" textAnchor="middle">
              {labels[index]}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}

function buildAreaChart(values: number[], width = 320, height = 130) {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? 1 : max - min;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return `M0,${height} L${points} L${width},${height}`;
}

function buildChartPoints(values: number[], width = 320, height = 130) {
  if (values.length === 0) return [];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? 1 : max - min;
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y, value };
  });
}

function renderAreaChart(values: number[], labels: string[], onHover: ChartHoverHandler, onLeave: () => void) {
  const path = buildAreaChart(values, 320, 130);
  const line = buildSparklinePath(values, 320, 130);
  const points = buildChartPoints(values, 320, 130);

  return (
    <svg viewBox="0 0 320 150" className="w-full h-full" aria-hidden="true">
      {renderChartGrid(values, 320, 130, true, labels)}
      <path d={path} fill="rgba(14,165,233,0.18)" />
      <path d={line} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={`dot-${index}`} cx={point.x} cy={point.y} r="4" fill="#0284c7" stroke="#fff" strokeWidth="2" />
      ))}
      {points.map((point, index) => (
        <circle
          key={`hit-${index}`}
          cx={point.x}
          cy={point.y}
          r="14"
          fill="transparent"
          onMouseMove={(event) => onHover(event, formatCurrency(point.value))}
          onMouseLeave={onLeave}
          style={{ cursor: "pointer" }}
        />
      ))}
    </svg>
  );
}

function renderBarChart(values: number[], labels: string[], onHover: ChartHoverHandler, onLeave: () => void) {
  const bars = buildBarChart(values, 320, 130, 10);
  return (
    <svg viewBox="0 0 320 150" className="w-full h-full" aria-hidden="true">
      {renderChartGrid(values, 320, 130, false, labels)}
      {bars.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx="6"
          fill="#f97316"
          onMouseMove={(event) => onHover(event, formatNumber(bar.value))}
          onMouseLeave={onLeave}
          style={{ cursor: "pointer" }}
        />
      ))}
    </svg>
  );
}

function buildBarChart(values: number[], width = 320, height = 130, gap = 8) {
  if (values.length === 0) return [];
  const max = Math.max(...values);
  const barWidth = (width - gap * (values.length - 1)) / values.length;
  return values.map((value, index) => {
    const x = index * (barWidth + gap);
    const barHeight = max === 0 ? 0 : (value / max) * height;
    return {
      x,
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
      value,
    };
  });
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<AdminDashboardSummary | null>(null);
  const [areaTooltip, setAreaTooltip] = useState<string | null>(null);
  const [barTooltip, setBarTooltip] = useState<string | null>(null);
  const [areaMonthlyTooltip, setAreaMonthlyTooltip] = useState<string | null>(null);
  const [barMonthlyTooltip, setBarMonthlyTooltip] = useState<string | null>(null);

  const handleAreaHover: ChartHoverHandler = (_, text) => {
    setAreaTooltip(text);
  };

  const handleBarHover: ChartHoverHandler = (_, text) => {
    setBarTooltip(text);
  };

  const handleAreaMonthlyHover: ChartHoverHandler = (_, text) => {
    setAreaMonthlyTooltip(text);
  };

  const handleBarMonthlyHover: ChartHoverHandler = (_, text) => {
    setBarMonthlyTooltip(text);
  };

  const handleTooltipLeave = () => {
    setAreaTooltip(null);
    setBarTooltip(null);
    setAreaMonthlyTooltip(null);
    setBarMonthlyTooltip(null);
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    fetchAdminDashboard()
      .then((data) => {
        if (!isMounted) return;
        setDashboard(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Không thể tải dữ liệu dashboard.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "Người dùng đang hoạt động",
        value: dashboard ? dashboard.userStats.active_users.toString() : loading ? "--" : "0",
        note: "Số tài khoản đang kích hoạt",
      },
      {
        label: "Bài đăng chờ duyệt",
        value: dashboard ? dashboard.listingStats.pending_listings.toString() : loading ? "--" : "0",
        note: "Bài đăng cần xử lý ngay",
      },
      {
        label: "Bài đăng bị từ chối",
        value: dashboard ? dashboard.listingStats.rejected_listings.toString() : loading ? "--" : "0",
        note: "Những bài đăng đã bị từ chối",
      },
      {
        label: "Tổng bài đăng public từ User",
        value: dashboard ? dashboard.listingStats.total_listings.toString() : loading ? "--" : "0",
        note: "Số bài đăng đã được duyệt trong hệ thống",
      },
      {
        label: "Bài đăng nguồn khác",
        value: dashboard ? dashboard.listingStats.imported_listings.toString() : loading ? "--" : "0",
        note: "Bài đăng đến từ các nguồn khác",
      },
      {
        label: "Doanh thu hoàn thành",
        value: dashboard ? formatCurrency(dashboard.paymentStats.total_revenue) : loading ? "--" : "0 đ",
        note: "Tổng doanh thu đã xác nhận",
      },
    ],
    [dashboard, loading]
  );

  const userGrowthWeeklyValues = dashboard ? dashboard.userGrowthWeekly.map((point) => point.new_users) : [];
  const revenueTrendWeeklyValues = dashboard ? dashboard.revenueTrendWeekly.map((point) => point.revenue) : [];
  const userGrowthYearlyValues = dashboard ? dashboard.userGrowthYearly.map((point) => point.new_users) : [];
  const revenueTrendYearlyValues = dashboard ? dashboard.revenueTrendYearly.map((point) => point.revenue) : [];
  
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const dailyLabels = dashboard ? dashboard.userGrowthWeekly.map((point) => point.day) : [];
  const monthlyLabels = dashboard ? dashboard.userGrowthYearly.map((point) => point.month) : [];

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="dashboard" onLogout={async () => {
          try {
            await logout();
          } finally {
            localStorage.removeItem("access_token");
            navigate("/");
          }
        }} />

        <main className="flex-1 space-y-6">
          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-500">Bảng điều khiển</p>
                <h1 className="text-2xl font-bold">Tổng quan quản trị</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi thuận tiện hoạt động bài đăng, nguồn dữ liệu, báo cáo và doanh thu.</p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50"
              >
                Về trang chủ
              </button>
            </div>
          </section>

          {error && (
            <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
              {error}
            </section>
          )}

          <section className="grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.35)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-800">{card.value}</p>
                <p className="mt-2 text-sm text-slate-400">{card.note}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6">
            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <h2 className="text-lg font-semibold text-slate-800">Doanh thu & Dòng tiền</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Doanh thu 7 ngày</p>
                  <p className="mt-3 text-2xl font-bold text-slate-800">{dashboard ? formatCurrency(dashboard.paymentStats.revenue_last_7d) : loading ? "--" : "0 đ"}</p>
                  <p className="mt-2 text-sm text-slate-500">So sánh với tuần trước: {dashboard ? formatCurrency(dashboard.paymentStats.revenue_last_7d - dashboard.paymentStats.revenue_prev_7d) : "--"}</p>
                </div>
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Doanh thu 30 ngày</p>
                  <p className="mt-3 text-2xl font-bold text-slate-800">{dashboard ? formatCurrency(dashboard.paymentStats.revenue_last_30d) : loading ? "--" : "0 đ"}</p>
                  <p className="mt-2 text-sm text-slate-500">Số giao dịch hoàn thành: {dashboard ? dashboard.paymentStats.completed_transactions : loading ? "--" : "0"}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Doanh thu chờ xác nhận</p>
                  <p className="mt-3 text-2xl font-bold text-slate-800">{dashboard ? formatCurrency(dashboard.paymentStats.pending_revenue) : loading ? "--" : "0 đ"}</p>
                  <p className="mt-2 text-sm text-slate-500">Giao dịch đang chờ admin xác nhận.</p>
                </div>
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Người dùng mới 7 ngày</p>
                  <p className="mt-3 text-2xl font-bold text-slate-800">{dashboard ? dashboard.userStats.new_users_last_7d : loading ? "--" : "0"}</p>
                  <p className="mt-2 text-sm text-slate-500">So sánh tuần trước: {dashboard ? dashboard.userStats.new_users_prev_7d : "--"}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Dòng doanh thu theo ngày</p>
                      <p className="mt-3 text-lg font-bold text-slate-800">{dashboard ? formatCurrency(dashboard.revenueTrendWeekly.reduce((sum, item) => sum + item.revenue, 0)) : loading ? "--" : "0 đ"}</p>
                    </div>
                    <span className="text-xs text-slate-500">Tháng {currentMonth}</span>
                  </div>
                  <div className="relative mt-4 h-[180px] w-full overflow-hidden rounded-3xl bg-slate-100 p-4">
                    {dashboard ? renderAreaChart(revenueTrendWeeklyValues, filterDailyLabels(dailyLabels), handleAreaHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                    {areaTooltip ? (
                      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        {areaTooltip}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Dòng doanh thu theo tháng</p>
                      <p className="mt-3 text-lg font-bold text-slate-800">{dashboard ? formatCurrency(dashboard.revenueTrendYearly.reduce((sum, item) => sum + item.revenue, 0)) : loading ? "--" : "0 đ"}</p>
                    </div>
                    <span className="text-xs text-slate-500">Năm {currentYear}</span>
                  </div>
                  <div className="relative mt-4 h-[180px] w-full overflow-hidden rounded-3xl bg-slate-100 p-4">
                    {dashboard ? renderAreaChart(revenueTrendYearlyValues, monthlyLabels, handleAreaMonthlyHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                    {areaMonthlyTooltip ? (
                      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        {areaMonthlyTooltip}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Người dùng mới theo ngày</p>
                      <p className="mt-3 text-lg font-bold text-slate-800">{dashboard ? dashboard.userGrowthWeekly.reduce((sum, item) => sum + item.new_users, 0) : loading ? "--" : "0"}</p>
                    </div>
                    <span className="text-xs text-slate-500">Tháng {currentMonth}</span>
                  </div>
                  <div className="relative mt-4 h-[180px] w-full overflow-hidden rounded-3xl bg-slate-100 p-4">
                    {dashboard ? renderAreaChart(userGrowthWeeklyValues, filterDailyLabels(dailyLabels), handleBarHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                    {barTooltip ? (
                      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        {barTooltip}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Người dùng mới theo tháng</p>
                      <p className="mt-3 text-lg font-bold text-slate-800">{dashboard ? dashboard.userGrowthYearly.reduce((sum, item) => sum + item.new_users, 0) : loading ? "--" : "0"}</p>
                    </div>
                    <span className="text-xs text-slate-500">Năm {currentYear}</span>
                  </div>
                  <div className="relative mt-4 h-[180px] w-full overflow-hidden rounded-3xl bg-slate-100 p-4">
                    {dashboard ? renderBarChart(userGrowthYearlyValues, monthlyLabels, handleBarMonthlyHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                    {barMonthlyTooltip ? (
                      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        {barMonthlyTooltip}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Giao dịch mới</h2>
                <button
                  onClick={() => navigate("/admin/payments")}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                >
                  Xem chi tiết
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard && dashboard.recentPayments.length > 0 ? (
                  dashboard.recentPayments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{payment.code || "Không có mã"}</p>
                          <p className="text-xs text-slate-500">{payment.package_name} • 
                            <span className={`inline-block ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {payment.status}
                            </span>
                          </p>
                        </div>
                        <span className="font-semibold text-orange-700">{formatCurrency(payment.amount)}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{payment.listing_title || "Bài đăng không xác định"}</p>
                    </div>
                  ))
                ) : dashboard ? (
                  <p className="text-sm text-slate-500">Không có giao dịch gần đây.</p>
                ) : (
                  <p className="text-sm text-slate-500">Đang tải...</p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Báo cáo mới</h2>
                <button
                  onClick={() => navigate("/admin/reports")}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                >
                  Xem chi tiết
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard && dashboard.recentReports.length > 0 ? (
                  dashboard.recentReports.map((report) => (
                    <div key={report.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{report.listing_title || "Bài đăng"}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                          report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          report.status === 'REJECTED' ? 'bg-slate-100 text-slate-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{report.reason}</p>
                      <p className="mt-2 text-xs text-slate-500">{report.reporter_name || report.reporter_email || "Người dùng ẩn"}</p>
                    </div>
                  ))
                ) : dashboard ? (
                  <p className="text-sm text-slate-500">Không có báo cáo mới.</p>
                ) : (
                  <p className="text-sm text-slate-500">Đang tải...</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <h2 className="text-lg font-semibold text-slate-800">Yêu cầu nhanh</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  onClick={() => navigate(link.path)}
                  className="rounded-[18px] border border-orange-100 bg-orange-50/40 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-30px_rgba(255,115,0,0.4)]"
                >
                  <p className="text-sm font-semibold text-slate-800">{link.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{link.description}</p>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
