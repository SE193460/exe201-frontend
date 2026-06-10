import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkoutPayment } from "../api/services/payments";
import UserShell from "@/layouts/UserShell";

const packages = [

    {
        name: "VIP 1",
        amount: 10000,
        duration: "3 ngày",
        benefits: [
            "Đẩy lên đầu danh sách",
            "Tăng khả năng tiếp cận"
        ]
    },

    {
        name: "VIP 2",
        amount: 30000,
        duration: "7 ngày",
        benefits: [
            "Ưu tiên hiển thị",
            "Nhãn VIP"
        ]
    },

    {
        name: "VIP Premium",
        amount: 50000,
        duration: "15 ngày",
        benefits: [
            "Ghim đầu trang",
            "Nổi bật màu đỏ",
            "Ưu tiên tìm kiếm"
        ]
    }

];

export default function PaymentPackages() {

    const { listingId } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [selected, setSelected] = useState<any>(null);

    const handlePayment = async () => {

        if (!selected) return;

        try {

            setLoading(true);

            await checkoutPayment({

                listingId: listingId!,
                packageName: selected.name,
                amount: selected.amount

            })

            navigate("/payment-history");

        }
        catch {

            alert("Thanh toán thất bại");

        }
        finally {

            setLoading(false);

        }

    }

    return (
        <UserShell>
            <div className="
min-h-screen
bg-[#fff7f2]
p-8
">

                <div className="
max-w-6xl
mx-auto
">

                    <h1
                        className="
text-3xl
font-black
mb-2
"
                    >

                        Thanh toán đẩy bài đăng

                    </h1>

                    <p className="text-slate-500 mb-8">

                        Chọn gói để tăng hiển thị bài đăng

                    </p>

                    <div className="grid md:grid-cols-3 gap-6">

                        {packages.map(pkg => (

                            <div
                                key={pkg.name}
                                onClick={() => setSelected(pkg)}
                                className={`

cursor-pointer
rounded-[24px]
bg-white
p-6
border-2

${selected?.name === pkg.name
                                        ?

                                        "border-orange-500"

                                        :

                                        "border-orange-100"

                                    }

shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]

`}
                            >

                                <h2
                                    className="
font-black
text-xl
"
                                >

                                    {pkg.name}

                                </h2>

                                <p
                                    className="
text-3xl
font-black
text-[#ff6a3d]
mt-3
"
                                >

                                    {pkg.amount.toLocaleString()}đ

                                </p>

                                <p
                                    className="
text-sm
text-slate-500
mt-2
"
                                >

                                    {pkg.duration}

                                </p>

                                <div className="mt-5">

                                    {pkg.benefits.map(
                                        (item: string) => (
                                            <p>

                                                ✓ {item}

                                            </p>
                                        )
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                    <div className="mt-8">

                        <button
                            disabled={!selected || loading}
                            onClick={handlePayment}
                            className="
rounded-full
bg-[#ff6a3d]
px-8
py-4
text-white
font-bold
"
                        >

                            {loading
                                ?
                                "Đang xử lý..."
                                :
                                "Thanh toán ngay"
                            }

                        </button>

                    </div>

                </div>

            </div>
        </UserShell>
    )

}