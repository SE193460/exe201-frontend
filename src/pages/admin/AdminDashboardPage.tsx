import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logout } from "../../api/services/auth";
import { fetchAdminDashboard, type AdminDashboardSummary } from "../../api/services/admin";
import { fetchAnalyticsSummary, type AnalyticsSummary } from "../../api/services/analytics";
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

function renderAnalyticsBarChart(values: number[], labels: string[]) {
  if (values.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-500">Chưa có dữ liệu</div>;
  }

  return (
    <div className="mt-4 rounded-[20px] border border-slate-100 bg-slate-50 p-4">
      <div className="h-48 w-full">
        {renderBarChart(values, labels, () => undefined, () => undefined)}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<AdminDashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
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

    Promise.allSettled([fetchAdminDashboard(), fetchAnalyticsSummary()])
      .then(([dashboardResult, analyticsResult]) => {
        if (!isMounted) return;
        if (dashboardResult.status === "fulfilled") {
          setDashboard(dashboardResult.value);
        } else {
          setError(t("Không thể tải dữ liệu dashboard."));
        }
        if (analyticsResult.status === "fulfilled") {
          setAnalytics(analyticsResult.value);
        } else if (dashboardResult.status === "rejected") {
          setError(t("Không thể tải dữ liệu dashboard hoặc analytics."));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError(t("Không thể tải dữ liệu dashboard."));
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
        label: t("Người dùng đang hoạt động"),
        value: dashboard ? dashboard.userStats.active_users.toString() : loading ? "--" : "0",
        note: t("Số tài khoản đang kích hoạt"),
      },
      {
        label: t("Bài đăng chờ duyệt"),
        value: dashboard ? dashboard.listingStats.pending_listings.toString() : loading ? "--" : "0",
        note: t("Bài đăng cần xử lý ngay"),
      },
      {
        label: t("Bài đăng bị từ chối"),
        value: dashboard ? dashboard.listingStats.rejected_listings.toString() : loading ? "--" : "0",
        note: t("Những bài đăng đã bị từ chối"),
      },
      {
        label: t("Tổng bài đăng public từ User"),
        value: dashboard ? dashboard.listingStats.total_listings.toString() : loading ? "--" : "0",
        note: t("Số bài đăng đã được duyệt trong hệ thống"),
      },
      {
        label: t("Bài đăng nguồn khác"),
        value: dashboard ? dashboard.listingStats.imported_listings.toString() : loading ? "--" : "0",
        note: t("Bài đăng đến từ các nguồn khác"),
      },
      {
        label: t("Doanh thu hoàn thành"),
        value: dashboard ? formatCurrency(dashboard.paymentStats.total_revenue) : loading ? "--" : "0 đ",
        note: t("Tổng doanh thu đã xác nhận"),
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
  const analyticsSeries = analytics
    ? [...analytics.activeUsersByMonth].sort((a, b) => a.month.localeCompare(b.month))
    : [];
  const analyticsMonths = analyticsSeries.map((entry) => entry.month);
  const analyticsActiveUsers = analyticsSeries.map((entry) => entry.activeUsers);
  const topListings = analytics ? analytics.topListings : [];
  const areaStats = analytics ? analytics.areaStats : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="dashboard" onLogout={async () => {
          try { await logout(); } finally { localStorage.removeItem("access_token"); navigate("/"); }
        }} />

        <main className="flex-1 space-y-6">
          {/* Header */}
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Bảng điều khiển")}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>{t("Tổng quan quản trị")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("Theo dõi thuận tiện hoạt động bài đăng, nguồn dữ liệu, báo cáo và doanh thu.")}</p>
            </div>
            <button onClick={() => navigate("/")} className="self-start rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50">
              {t("Về trang chủ")}
            </button>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">{error}</div>
          )}

          {/* Stats Cards */}
          <section className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-800">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.note}</p>
              </div>
            ))}
          </section>

          {/* Revenue Section */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Doanh thu & Dòng tiền")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Doanh thu 7 ngày")}</p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">{dashboard ? formatCurrency(dashboard.paymentStats.revenue_last_7d) : loading ? "--" : "0 đ"}</p>
                <p className="mt-1 text-xs text-slate-500">{t("So sánh với tuần trước:")} {dashboard ? formatCurrency(dashboard.paymentStats.revenue_last_7d - dashboard.paymentStats.revenue_prev_7d) : "--"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Doanh thu 30 ngày")}</p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">{dashboard ? formatCurrency(dashboard.paymentStats.revenue_last_30d) : loading ? "--" : "0 đ"}</p>
                <p className="mt-1 text-xs text-slate-500">{t("Số giao dịch hoàn thành:")} {dashboard ? dashboard.paymentStats.completed_transactions : loading ? "--" : "0"}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Doanh thu chờ xác nhận")}</p>
                <p className="mt-2 text-xl font-extrabold text-[var(--primary)]">{dashboard ? formatCurrency(dashboard.paymentStats.pending_revenue) : loading ? "--" : "0 đ"}</p>
                <p className="mt-1 text-xs text-slate-500">{t("Giao dịch đang chờ admin xác nhận.")}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Người dùng mới 7 ngày")}</p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">{dashboard ? dashboard.userStats.new_users_last_7d : loading ? "--" : "0"}</p>
                <p className="mt-1 text-xs text-slate-500">{t("So sánh tuần trước:")} {dashboard ? dashboard.userStats.new_users_prev_7d : "--"}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Dòng doanh thu theo ngày")}</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-800">{dashboard ? formatCurrency(dashboard.revenueTrendWeekly.reduce((sum, item) => sum + item.revenue, 0)) : loading ? "--" : "0 đ"}</p>
                  </div>
                  <span className="text-xs text-slate-400">{t("Tháng")} {currentMonth}</span>
                </div>
                <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50 p-3">
                  {dashboard ? renderAreaChart(revenueTrendWeeklyValues, filterDailyLabels(dailyLabels), handleAreaHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                  {areaTooltip && (
                    <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow">{areaTooltip}</div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Dòng doanh thu theo tháng")}</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-800">{dashboard ? formatCurrency(dashboard.revenueTrendYearly.reduce((sum, item) => sum + item.revenue, 0)) : loading ? "--" : "0 đ"}</p>
                  </div>
                  <span className="text-xs text-slate-400">{t("Năm")} {currentYear}</span>
                </div>
                <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50 p-3">
                  {dashboard ? renderAreaChart(revenueTrendYearlyValues, monthlyLabels, handleAreaMonthlyHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                  {areaMonthlyTooltip && (
                    <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow">{areaMonthlyTooltip}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Người dùng mới theo ngày")}</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-800">{dashboard ? dashboard.userGrowthWeekly.reduce((sum, item) => sum + item.new_users, 0) : loading ? "--" : "0"}</p>
                  </div>
                  <span className="text-xs text-slate-400">{t("Tháng")} {currentMonth}</span>
                </div>
                <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50 p-3">
                  {dashboard ? renderAreaChart(userGrowthWeeklyValues, filterDailyLabels(dailyLabels), handleBarHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                  {barTooltip && (
                    <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow">{barTooltip}</div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Người dùng mới theo tháng")}</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-800">{dashboard ? dashboard.userGrowthYearly.reduce((sum, item) => sum + item.new_users, 0) : loading ? "--" : "0"}</p>
                  </div>
                  <span className="text-xs text-slate-400">{t("Năm")} {currentYear}</span>
                </div>
                <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50 p-3">
                  {dashboard ? renderBarChart(userGrowthYearlyValues, monthlyLabels, handleBarMonthlyHover, handleTooltipLeave) : <div className="h-full w-full bg-slate-100" />}
                  {barMonthlyTooltip && (
                    <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow">{barMonthlyTooltip}</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Analytics Section */}
          <section className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Analytics Users")}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-main)" }}>{t("Phân tích hành vi và hiệu suất đăng tin")}</h2>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Số người hoạt động theo tháng")}</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-800">{analytics ? analytics.activeUsersByMonth.reduce((sum, item) => sum + item.activeUsers, 0) : loading ? "--" : "0"}</p>
                  </div>
                  <span className="text-xs text-slate-400">{t("Năm")} 2026</span>
                </div>
                {renderAnalyticsBarChart(analyticsActiveUsers, analyticsMonths)}
              </div>

              <div className="grid gap-4">
                <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Tổng lượt xem chi tiết bài đăng")}</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-800">{analytics ? analytics.totals.detailViewCount : loading ? "--" : "0"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Tổng lượt click Zalo button")}</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-800">{analytics ? analytics.totals.zaloClickCount : loading ? "--" : "0"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white border-l-4 border-l-[var(--primary)] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("Tổng click Phone button")}</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-800">{analytics ? analytics.totals.phoneClickCount : loading ? "--" : "0"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-700">{t("Top bài đăng nổi bật")}</h3>
                <div className="mt-3 overflow-x-auto">
                  <div className="max-h-[18rem] overflow-y-auto rounded-lg border border-slate-100">
                    <table className="min-w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-3 py-2">{t("Bài đăng")}</th>
                          <th className="px-3 py-2">{t("View")}</th>
                          <th className="px-3 py-2">{t("Phone")}</th>
                          <th className="px-3 py-2">{t("Zalo")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topListings.length > 0 ? topListings.map((listing) => (
                          <tr key={listing.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2">
                              <button type="button" onClick={() => navigate(`/listings/${listing.id}`)}
                                className="text-left font-semibold text-slate-700 transition hover:text-[var(--primary)]">
                                {listing.title}
                              </button>
                              <div className="text-[11px] text-slate-400">{listing.district || "—"}</div>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{listing.detailViewCount}</td>
                            <td className="px-3 py-2 text-slate-600">{listing.phoneClickCount}</td>
                            <td className="px-3 py-2 text-slate-600">{listing.zaloClickCount}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-3 py-3 text-center text-slate-400 text-xs">{t("Chưa có dữ liệu tracking")}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-700">{t("Thống kê theo khu vực")}</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="pb-2 pr-3">{t("Khu vực")}</th>
                        <th className="pb-2 pr-3">{t("Lọc")}</th>
                        <th className="pb-2 pr-3">{t("Click")}</th>
                        <th className="pb-2">{t("Bài")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaStats.length > 0 ? areaStats.map((area) => (
                        <tr key={area.district} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-3 font-semibold text-slate-700">{area.district}</td>
                          <td className="py-2 pr-3 text-slate-600">{area.filterCount}</td>
                          <td className="py-2 pr-3 text-slate-600">{area.detailClickCount}</td>
                          <td className="py-2 text-slate-600">{area.listingCount}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="py-3 text-center text-slate-400 text-xs">{t("Chưa có dữ liệu khu vực")}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-700">{t("Tỷ lệ click bài đăng được đề xuất và bài thường")}</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{t("Đề xuất")}</span>
                    <span className="text-sm font-bold text-slate-800">{analytics ? analytics.recommendationStats.recommendedClicks : 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{t("Bình thường")}</span>
                    <span className="text-sm font-bold text-slate-800">{analytics ? analytics.recommendationStats.normalClicks : 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{t("Tỷ lệ đề xuất")}</span>
                    <span className="text-sm font-bold text-[var(--primary)]">{analytics ? `${Math.round(analytics.recommendationStats.recommendedRate * 100)}%` : "0%"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-700">{t("Số lần cập nhật Hồ sơ lối sống và Bộ lọc mềm")}</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{t("Hồ sơ lối sống")}</span>
                    <span className="text-sm font-bold text-slate-800">{analytics ? analytics.updates.lifestyleProfileUpdates : 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{t("Bộ lọc mềm")}</span>
                    <span className="text-sm font-bold text-slate-800">{analytics ? analytics.updates.softFilterUpdates : 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Giao dịch mới")}</h2>
              <button onClick={() => navigate("/admin/payments")}
                className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] hover:bg-orange-100 transition">
                {t("Xem chi tiết")}
              </button>
            </div>
            <div className="space-y-3">
              {dashboard && dashboard.recentPayments.length > 0 ? (
                dashboard.recentPayments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border border-slate-200 bg-white px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{payment.code || "—"}</span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        payment.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' :
                        payment.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>{payment.status}</span>
                      <span className="hidden sm:inline text-xs text-slate-500 truncate">{payment.listing_title || t("Bài đăng")}</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">{formatCurrency(payment.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">{loading ? t("Đang tải...") : t("Không có giao dịch gần đây.")}</p>
              )}
            </div>
          </section>

          {/* Recent Reports */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Báo cáo mới")}</h2>
              <button onClick={() => navigate("/admin/reports")}
                className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] hover:bg-orange-100 transition">
                {t("Xem chi tiết")}
              </button>
            </div>
            <div className="space-y-3">
              {dashboard && dashboard.recentReports.length > 0 ? (
                dashboard.recentReports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-slate-200 bg-white px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-700 truncate">{report.listing_title || t("Bài đăng")}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        report.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                        report.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>{report.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{report.reason}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{report.reporter_name || report.reporter_email || t("Người dùng ẩn")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">{loading ? t("Đang tải...") : t("Không có báo cáo mới.")}</p>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Yêu cầu nhanh")}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {quickLinks.map((link) => (
                <button key={link.title} onClick={() => navigate(link.path)}
                  className="rounded-lg border border-slate-200 bg-white border-t-2 border-t-[var(--primary)] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-sm font-bold text-slate-800">{link.title}</p>
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
