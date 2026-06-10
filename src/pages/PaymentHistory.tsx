
import { useEffect, useState } from "react";

import {
    fetchMyPaymentHistory,
    type PaymentTransaction
}
    from "../api/services/payments";
import UserShell from "@/layouts/UserShell";

export default function PaymentHistory() {

    const [payments, setPayments] =
        useState<PaymentTransaction[]>([]);

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        try {

            const data =
                await fetchMyPaymentHistory();

            setPayments(data);

        }
        catch (error) {

            console.log(error);

        }

    }

    return (
        <UserShell>
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Lịch sử thanh toán</h1>
                        <p className="mt-1 text-sm text-slate-500">Xem lại các giao dịch thanh toán của bạn</p>
                    </div>
                </header>
            </div>

            <div className="mx-auto mt-6 grid w-full max-w-[1100px] gap-6 md:grid-cols-2 lg:grid-cols-3">

                {payments.map(item => (

                    <div
                        key={item.id}
                        className="
rounded-[24px]
bg-white
p-5
border
border-orange-100
shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]
"
                    >

                        <div
                            className="
flex
justify-between
"
                        >

                            <div>

                                <h3
                                    className="
font-bold
"
                                >

                                    {item.packageName}

                                </h3>

                                <p
                                    className="
text-sm
text-slate-500
"
                                >

                                    {item.listingTitle}

                                </p>

                            </div>

                            <span
                                className="
bg-green-100
text-green-700
px-3
py-1
rounded-full
text-xs
font-bold
"
                            >

                                {item.status}

                            </span>

                        </div>

                        <p
                            className="
mt-4
text-[#ff6a3d]
font-black
text-2xl
"
                        >

                            {item.amount.toLocaleString()}đ

                        </p>

                        <p
                            className="
text-xs
text-slate-400
mt-2
"
                        >

                            {new Date(
                                item.created_at
                            ).toLocaleString()}

                        </p>

                    </div>

                ))}

            </div>
        </UserShell>
    )

}