import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const profile = await prisma.user.findUnique({
        where: { id: id },

        include: {
            hashing: {
                where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
                orderBy: { date: "asc" },
            },
        },
    });
    return profile;
};
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    }
    const user = await getUser(session.userId);
    if (user?.hashing.length == 0) {
        return NextResponse.json({ error: "no hash data found" });
    }
    //Accumulate the chart data.
    const coinPrice: any[] = [];
    coinPrice.push(["date", "BTC/NZD"]);

    const hashRevenue = [];
    hashRevenue.push(["date", "Mined BTC", "BTC value in $", "Electricity cost", "Profit"]);
    const hashUptime = [];
    hashUptime.push(["date", "uptimeMinutes"]);
    const relativeMining = [];
    relativeMining.push(["date", "Bitcoin per unit uptime"]);

    let totalBitcoin = 0;
    let totalBitcoinValue = 0;
    let totalElec = 0;
    let totalElecCost = 0;
    let totalProfit = 0;
    user?.hashing.forEach((item: any) => {
        totalElec += (item.uptimeTotalMinutes / 60) * 3.3;
        totalBitcoin += parseFloat(item.revenue);
        //electricity cost = uptime mins / 60 = hrs * 3.3KW * 0.12c/kw
        const elect = (item.uptimeTotalMinutes / 60) * 3.3 * 0.12;
        totalElecCost += elect;
        let bitcoinValue = 0;

        bitcoinValue = item.averagePrice * parseFloat(item.revenue);
        const profit = bitcoinValue - elect;
        totalProfit = totalProfit + profit;
        totalBitcoinValue += bitcoinValue;
        hashRevenue.push([new Date(item.date), parseFloat(item.revenue), bitcoinValue, elect, profit]);

        hashUptime.push([new Date(item.date), parseFloat(item.uptimePercentage)]);
        relativeMining.push([
            new Date(item.date),
            (1 / parseFloat(item.uptimePercentage)) * parseFloat(item.revenue) * 100,
        ]);
        coinPrice.push([new Date(item.time_period_start), item.averagePrice]);
    });

    if (user) return NextResponse.json({ coinPrice, hashRevenue, hashUptime, relativeMining });
    return NextResponse.json({ result: "no user found" });
}
