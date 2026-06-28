import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Home, Sparkles } from "lucide-react";
import { updateLifestyleProfile, updateRoommatePreferences, type LifestyleProfile, type RoommatePreferences } from "../api/services/lifestyle";
import { FILTER_LINEAR_OPTIONS, PREF_OPTIONS, PROFILE_OPTIONS } from "./lifestyleOptions";
import { trackEvent } from "../api/services/analytics";

type UserType = "HAS_ROOM" | "NO_ROOM" | null;

const sections = [
  {
    title: "Sinh hoạt cơ bản",
    description: "Các câu hỏi đầu tiên giúp hệ thống hiểu thói quen sinh hoạt của bạn.",
  },
  {
    title: "Thói quen ở phòng",
    description: "Những câu hỏi tiếp theo giúp hiểu rõ nhịp sinh hoạt trong phòng.",
  },
  {
    title: "Môi trường sống chung",
    description: "Đây là phần quan trọng để đề xuất roommate phù hợp hơn.",
  },
];

function buildQuestions(userType: UserType) {
  if (userType === "HAS_ROOM") {
    return [
      {
        key: "cleanliness",
        section: sections[0].title,
        title: "Mức độ sạch sẽ",
        helper: "Bạn có xu hướng giữ phòng như thế nào?",
        explanation: "Độ sạch sẽ là một trong những nguyên nhân phổ biến nhất gây mâu thuẫn giữa các roommate.",
        options: PROFILE_OPTIONS.cleanliness.map((option) => ({ value: option.value, label: option.label.split(":")[0], description: option.label.split(":")[1] || "" })),
      },
      {
        key: "ac_usage",
        section: sections[0].title,
        title: "Tần suất sử dụng điều hòa",
        helper: "Bạn thường bật điều hòa nhiều hay ít?",
        explanation: "Thói quen dùng điều hòa ảnh hưởng đến chi phí điện và sự thoải mái khi ở chung.",
        options: PROFILE_OPTIONS.ac_usage.map((option) => ({ value: option.value, label: option.label.split(":")[0], description: option.label.split(":")[1] || "" })),
      },
      {
        key: "pet_status",
        section: sections[0].title,
        title: "Thú cưng",
        helper: "Bạn có nuôi thú cưng không?",
        explanation: "Thú cưng ảnh hưởng trực tiếp đến không gian sống và nhịp sinh hoạt của cả phòng.",
        options: PROFILE_OPTIONS.binary.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "smoking_status",
        section: sections[0].title,
        title: "Hút thuốc",
        helper: "Bạn có hút thuốc không?",
        explanation: "Hút thuốc ảnh hưởng trực tiếp đến môi trường sống và là một nguồn xung đột phổ biến.",
        options: PROFILE_OPTIONS.binary.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "cooking",
        section: sections[1].title,
        title: "Thói quen nấu ăn",
        helper: "Bạn có thường xuyên nấu ăn trong phòng không?",
        explanation: "Thói quen nấu ăn ảnh hưởng đến việc sử dụng bếp, vệ sinh và chi phí sinh hoạt.",
        options: PROFILE_OPTIONS.cooking.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "guest",
        section: sections[1].title,
        title: "Tần suất dẫn bạn bè về phòng",
        helper: "Bạn có thường mời bạn bè về phòng không?",
        explanation: "Tần suất tiếp khách ảnh hưởng đến không gian riêng và sự tiện nghi khi ở chung.",
        options: PROFILE_OPTIONS.guest.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "home_frequency",
        section: sections[1].title,
        title: "Tần suất ở trong phòng",
        helper: "Bạn thường dành nhiều thời gian ở phòng hay bên ngoài?",
        explanation: "Mức độ ở trong phòng ảnh hưởng đến nhịp sống và sự thuận tiện trong việc chia sẻ không gian.",
        options: PROFILE_OPTIONS.home_frequency.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "work_schedule",
        section: sections[1].title,
        title: "Khung thời gian học tập / làm việc",
        helper: "Bạn chủ yếu học và làm việc vào thời gian nào?",
        explanation: "Lịch làm việc ảnh hưởng đến tiếng ồn, thời gian ở phòng và sự hòa hợp khi sống chung.",
        options: PROFILE_OPTIONS.work_schedule.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "sharing",
        section: sections[2].title,
        title: "Mức độ chia sẻ đồ dùng",
        helper: "Bạn có thoải mái cho roommate dùng chung đồ không?",
        explanation: "Mức độ chia sẻ đồ dùng ảnh hưởng đến sự thoải mái và sự tin tưởng khi sống chung.",
        options: PROFILE_OPTIONS.sharing.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "noise",
        section: sections[2].title,
        title: "Mức độ tạo tiếng ồn",
        helper: "Bạn có xu hướng yên tĩnh hay ồn ào?",
        explanation: "Mức độ tiếng ồn có thể là nguyên nhân lớn của xung đột khi sống cùng nhau.",
        options: PROFILE_OPTIONS.noise.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "call_frequency",
        section: sections[2].title,
        title: "Tần suất gọi điện / video call",
        helper: "Bạn có thường xuyên gọi điện hoặc gọi video không?",
        explanation: "Nhịp gọi điện và video call ảnh hưởng đến mức độ yên tĩnh và sự thoải mái của phòng.",
        options: PROFILE_OPTIONS.call_frequency.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
      {
        key: "game_mic",
        section: sections[2].title,
        title: "Mức độ chơi game dùng voice chat",
        helper: "Bạn có thường xuyên chơi game có dùng mic không?",
        explanation: "Hoạt động chơi game bằng mic có thể ảnh hưởng đến tiếng ồn và thời gian ở chung.",
        options: PROFILE_OPTIONS.game_mic.map((option) => ({ value: option.value, label: option.label, description: option.label })),
      },
    ];
  }

  return [
    {
      key: "pref_cleanliness",
      section: sections[0].title,
      title: "Mức độ sạch sẽ",
      helper: "Bạn muốn roommate có mức độ sạch sẽ như thế nào?",
      explanation: "Độ sạch sẽ là một trong những nguyên nhân phổ biến nhất gây mâu thuẫn giữa các roommate.",
      options: [...FILTER_LINEAR_OPTIONS.cleanliness, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_ac_usage",
      section: sections[0].title,
      title: "Tần suất sử dụng điều hòa",
      helper: "Bạn có ưu tiên roommate dùng điều hòa nhiều hay ít?",
      explanation: "Thói quen dùng điều hòa ảnh hưởng đến chi phí điện và sự thoải mái khi ở chung.",
      options: [...FILTER_LINEAR_OPTIONS.ac_usage, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_pet",
      section: sections[0].title,
      title: "Thú cưng",
      helper: "Bạn có thích roommate nuôi thú cưng không?",
      explanation: "Thú cưng ảnh hưởng trực tiếp đến không gian sống và nhịp sinh hoạt của cả phòng.",
      options: PREF_OPTIONS.pet.map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_smoking",
      section: sections[0].title,
      title: "Hút thuốc",
      helper: "Bạn có mong muốn roommate có hút thuốc không?",
      explanation: "Hút thuốc ảnh hưởng trực tiếp đến môi trường sống và là một nguồn xung đột phổ biến.",
      options: PREF_OPTIONS.smoking.map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_cooking",
      section: sections[1].title,
      title: "Thói quen nấu ăn",
      helper: "Bạn có thích roommate thường xuyên nấu ăn không?",
      explanation: "Thói quen nấu ăn ảnh hưởng đến việc sử dụng bếp, vệ sinh và chi phí sinh hoạt.",
      options: [...FILTER_LINEAR_OPTIONS.cooking, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_guest",
      section: sections[1].title,
      title: "Tần suất dẫn bạn bè về phòng",
      helper: "Bạn có ưu tiên roommate có nhiều hay ít bạn bè ghé phòng?",
      explanation: "Tần suất tiếp khách ảnh hưởng đến không gian riêng và sự tiện nghi khi ở chung.",
      options: [...FILTER_LINEAR_OPTIONS.guest, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_home_frequency",
      section: sections[1].title,
      title: "Tần suất ở trong phòng",
      helper: "Bạn muốn roommate dành nhiều thời gian ở phòng hay ít hơn?",
      explanation: "Mức độ ở trong phòng ảnh hưởng đến nhịp sống và sự thuận tiện trong việc chia sẻ không gian.",
      options: [...FILTER_LINEAR_OPTIONS.home_frequency, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_work_schedule",
      section: sections[1].title,
      title: "Khung thời gian học tập / làm việc",
      helper: "Bạn có ưu tiên roommate học tập vào thời gian nào?",
      explanation: "Lịch làm việc ảnh hưởng đến tiếng ồn, thời gian ở phòng và sự hòa hợp khi sống chung.",
      options: PREF_OPTIONS.work_schedule.map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_sharing",
      section: sections[2].title,
      title: "Mức độ chia sẻ đồ dùng",
      helper: "Bạn có mong muốn roommate thoải mái chia sẻ đồ dùng không?",
      explanation: "Mức độ chia sẻ đồ dùng ảnh hưởng đến sự thoải mái và sự tin tưởng khi sống chung.",
      options: PREF_OPTIONS.sharing.map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_noise",
      section: sections[2].title,
      title: "Mức độ tạo tiếng ồn",
      helper: "Bạn ưu tiên roommate yên tĩnh hay có thể ồn một chút?",
      explanation: "Mức độ tiếng ồn có thể là nguyên nhân lớn của xung đột khi sống cùng nhau.",
      options: [...FILTER_LINEAR_OPTIONS.noise, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_call_frequency",
      section: sections[2].title,
      title: "Tần suất gọi điện / video call",
      helper: "Bạn muốn roommate gọi điện thường xuyên hay ít hơn?",
      explanation: "Nhịp gọi điện và video call ảnh hưởng đến mức độ yên tĩnh và sự thoải mái của phòng.",
      options: [...FILTER_LINEAR_OPTIONS.call_frequency, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
    {
      key: "pref_game_mic",
      section: sections[2].title,
      title: "Mức độ chơi game dùng voice chat",
      helper: "Bạn có ưu tiên roommate chơi game có dùng mic không?",
      explanation: "Hoạt động chơi game bằng mic có thể ảnh hưởng đến tiếng ồn và thời gian ở chung.",
      options: [...FILTER_LINEAR_OPTIONS.game_mic, PREF_OPTIONS.intAny].map((option) => ({ value: option.value, label: option.label, description: option.label })),
    },
  ];
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [userType, setUserType] = useState<UserType>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | null>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questions = useMemo(() => buildQuestions(userType), [userType]);
  const currentQuestion = questions[questionIndex];
  const progress = questions.length > 0 ? ((questionIndex + 1) / questions.length) * 100 : 0;
  const selectedValue = currentQuestion ? answers[currentQuestion.key] ?? null : null;
  const estimatedMinutes = Math.max(1, Math.ceil(questions.length / 8));
  const cardBaseClass = "group rounded-[24px] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-25px_rgba(255,115,0,0.5)]";
  const selectedCardClass = "border-orange-400 bg-orange-50/80 shadow-[0_20px_45px_-25px_rgba(255,115,0,0.45)]";
  const unselectedCardClass = "border-slate-200 bg-white hover:border-orange-300";

  const nextQuestion = () => {
    if (!currentQuestion) return;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      return;
    }
    void handleComplete();
  };

  const prevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else {
      setStep(1);
    }
  };

  const handleSelect = (value: string | number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
  };

  const handleComplete = async () => {
    if (!userType) return;
    setSubmitting(true);
    setError("");
    try {
      if (userType === "HAS_ROOM") {
        const payload: LifestyleProfile = Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [key, value === null ? null : value])
        ) as LifestyleProfile;
        await updateLifestyleProfile(payload);
      } else {
        const payload: RoommatePreferences = Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [key, value === null ? null : value])
        ) as RoommatePreferences;
        await updateRoommatePreferences(payload);
      }

      trackEvent({
        eventName: userType === "HAS_ROOM" ? "lifestyle_profile_updated" : "soft_filter_updated",
      });

      const key = `roomie_onboarding_completed_${window.location.hostname}`;
      localStorage.setItem(key, "true");
      if (userType === "HAS_ROOM") {
        navigate("/my-listings/new");
      } else {
        navigate("/listings");
      }
    } catch {
      setError("Không thể lưu hồ sơ lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,230,210,0.7),_transparent_45%),linear-gradient(135deg,_#fff7f2_0%,_#ffffff_100%)] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[36px] border border-orange-100 bg-white shadow-[0_35px_90px_-40px_rgba(255,115,0,0.7)]">
            <div className="flex flex-col lg:flex-row">
              <div className="flex w-full flex-col justify-between bg-gradient-to-br from-[#ff6a3d] via-[#ff7b44] to-[#ffa75b] p-8 text-white lg:w-[40%] lg:p-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                    <Sparkles className="h-4 w-4" />
                    Roomie onboarding
                  </div>
                  <h1 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">Chào mừng bạn đến với Roomie</h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-orange-50 sm:text-base">
                    Chúng tôi sẽ giúp bạn thiết lập hồ sơ nhanh chóng để tìm roommate phù hợp hơn, giảm xung đột và cá nhân hóa kết quả matching.
                  </p>
                </div>

                <div className="mt-8 space-y-3 text-sm">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3"><Sparkles className="h-4 w-4" /> Đề xuất roommate phù hợp hơn</div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3"><Home className="h-4 w-4" /> Giảm các xung đột khi sống chung</div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3"><Compass className="h-4 w-4" /> Cá nhân hóa kết quả matching</div>
                </div>
              </div>

              <div className="flex w-full flex-col justify-center p-8 lg:w-[60%] lg:p-10">
                <div className="max-w-[620px]">
                  <div className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                    <Sparkles className="mr-2 h-4 w-4" /> Thiết lập hồ sơ trong vài phút
                  </div>
                  <h2 className="mt-5 text-2xl font-bold text-slate-900 sm:text-3xl">Một quy trình nhanh, rõ ràng và dễ hoàn thành</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Chỉ cần chọn loại hồ sơ phù hợp, trả lời các câu hỏi ngắn và hệ thống sẽ dùng thông tin đó để đề xuất roommate phù hợp hơn.
                  </p>

                  <div className="mt-8 rounded-[24px] border border-orange-100 bg-[#fff7f2] p-5">
                    <p className="text-sm font-semibold text-slate-700">Thời gian hoàn thành</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-3xl font-black text-orange-600">≈ {estimatedMinutes} phút</span>
                      <span className="pb-1 text-sm text-slate-500">• 12 câu hỏi</span>
                    </div>
                  </div>

                  <button onClick={() => setStep(1)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-15px_rgba(255,115,0,0.8)] transition hover:opacity-90">
                    Bắt đầu <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_#fff7f2_0%,_#ffffff_100%)] px-4 py-8">
          <div className="w-full max-w-5xl rounded-[32px] border border-orange-100 bg-white p-6 shadow-[0_35px_90px_-45px_rgba(255,115,0,0.7)] sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Bước 2</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Bạn đang ở trường hợp nào?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Lựa chọn này giúp hệ thống hiển thị đúng bộ câu hỏi dành cho bạn.</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <button onClick={() => setUserType("HAS_ROOM")} className={`${cardBaseClass} ${userType === "HAS_ROOM" ? selectedCardClass : unselectedCardClass}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><Home className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">Tôi đã có phòng</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Tôi đang có phòng và muốn tìm roommate ở cùng. Sau khi hoàn thành, bạn sẽ được chuyển tới bước đăng bài.</p>
                <div className="mt-5 text-sm font-semibold text-orange-600">Chọn tùy chọn này →</div>
              </button>
              <button onClick={() => setUserType("NO_ROOM")} className={`${cardBaseClass} ${userType === "NO_ROOM" ? selectedCardClass : unselectedCardClass}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><Compass className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">Tôi đang tìm phòng</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Tôi muốn tìm phòng và roommate phù hợp. Sau khi hoàn thành, hệ thống sẽ ưu tiên hiển thị các bài đăng phù hợp.</p>
                <div className="mt-5 text-sm font-semibold text-orange-600">Chọn tùy chọn này →</div>
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button onClick={() => navigate("/auth")} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Đăng nhập lại</button>
              <button disabled={!userType} onClick={() => { setStep(2); setQuestionIndex(0); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-15px_rgba(255,115,0,0.8)] transition disabled:cursor-not-allowed disabled:opacity-60">
                Tiếp tục <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2 && currentQuestion) {
      return (
        <div className="min-h-screen bg-[linear-gradient(135deg,_#fff7f2_0%,_#ffffff_100%)] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row lg:gap-8">
            <aside className="w-full rounded-[28px] border border-orange-100 bg-white p-6 shadow-[0_25px_70px_-35px_rgba(255,115,0,0.45)] lg:sticky lg:top-4 lg:h-fit lg:w-[32%]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-orange-500">Thiết lập hồ sơ</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">{currentQuestion.section}</h3>
                  <p className="mt-2 text-sm text-slate-500">Câu hỏi được thiết kế để hệ thống hiểu rõ hơn về nhu cầu sống chung của bạn.</p>
                </div>
                <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">Câu {questionIndex + 1}/{questions.length}</div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-orange-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-6 rounded-[22px] border border-orange-100 bg-[#fff7f2] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600"><Sparkles className="h-4 w-4" /> Vì sao chúng tôi hỏi điều này?</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{currentQuestion.explanation}</p>
              </div>

              <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                <div className="flex items-center gap-2 font-semibold text-slate-700"><Sparkles className="h-4 w-4" /> Ước tính</div>
                <p className="mt-2">Chỉ còn khoảng {estimatedMinutes} phút để hoàn tất và bắt đầu trải nghiệm tốt hơn.</p>
              </div>
            </aside>

            <section className="mt-6 flex-1 rounded-[28px] border border-orange-100 bg-white p-6 shadow-[0_25px_70px_-35px_rgba(255,115,0,0.45)] lg:mt-0 lg:p-8">
              <div className="mx-auto max-w-[760px]">
                <div className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600 w-fit">{currentQuestion.section}</div>
                <h2 className="mt-4 text-3xl font-black text-slate-900">{currentQuestion.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{currentQuestion.helper}</p>

                <div className="mt-8 space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <button key={`${currentQuestion.key}-${String(option.value)}`} onClick={() => handleSelect(option.value)} className={`flex w-full items-start gap-3 rounded-[20px] border p-4 text-left transition-all duration-200 ${isSelected ? selectedCardClass : unselectedCardClass}`}>
                        <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-orange-500 bg-orange-500" : "border-slate-300"}`}>
                          {isSelected ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900">{option.label}</p>
                          {option.description ? <p className="mt-1 text-sm text-slate-500">{option.description}</p> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={prevQuestion} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                  </button>
                  <button disabled={selectedValue === null} onClick={nextQuestion} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-15px_rgba(255,115,0,0.8)] transition disabled:cursor-not-allowed disabled:opacity-60">
                    {questionIndex === questions.length - 1 ? "Hoàn thành" : "Tiếp tục"} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_#fff7f2_0%,_#ffffff_100%)] px-4 py-8">
        <div className="w-full max-w-3xl rounded-[32px] border border-orange-100 bg-white p-8 text-center shadow-[0_35px_90px_-45px_rgba(255,115,0,0.7)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600"><CheckCircle2 className="h-8 w-8" /></div>
          <h2 className="mt-6 text-3xl font-black text-slate-900">Hoàn tất!</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Hồ sơ của bạn đã được thiết lập thành công. Chúng tôi sẽ sử dụng thông tin này để đề xuất roommate phù hợp hơn.</p>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate(userType === "HAS_ROOM" ? "/my-listings/new" : "/listings")} disabled={submitting} className="rounded-full bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-15px_rgba(255,115,0,0.8)] transition disabled:opacity-60">
              {submitting ? "Đang lưu..." : userType === "HAS_ROOM" ? "Tạo bài đăng" : "Khám phá bài đăng"}
            </button>
            <button onClick={() => navigate("/listings")} className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Đến trang chủ</button>
          </div>
        </div>
      </div>
    );
  };

  return renderStepContent();
}
