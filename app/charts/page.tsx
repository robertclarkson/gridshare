
import { Card } from "@nextui-org/react";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";
import MiningChart from "./MiningChart";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const profile = await prisma.user.findUnique({
        where: { id: id },

        include: { 
            hashing: { orderBy: { date: "asc" } },
            disposals: { orderBy: { date: "asc" } }
        },
    });
    return profile;
};
export default async function Charts() {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return (
            <div>
                <h1>You need to log in first</h1>
            </div>
        );
    }
    const user = await getUser(session.userId);
    if (user?.hashing.length == 0) {
        return (
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <h1>You must pull in some hash data on the settings page</h1>
            </Card>
        );
    }
    //Accumulate the chart data.

    const disposals: any[] = [];
    disposals.push(["date", "BTC/NZD"]);

    const coinPrice: any[] = [];
    coinPrice.push(["date", "BTC/NZD"]);

    const hashRevenue = [];
    hashRevenue.push(["date","BTC value in $", "Electricity cost", "Profit"]);

    const hashRevenueCume = [];
    hashRevenueCume.push(["date","BTC value in $", "Electricity cost", "Profit"]);

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
        hashRevenue.push([new Date(item.date), bitcoinValue, elect, profit]);

        hashRevenueCume.push([new Date(item.date), totalBitcoinValue, totalElecCost, totalProfit]);

        hashUptime.push([new Date(item.date), parseFloat(item.uptimePercentage)]);
        relativeMining.push([
            new Date(item.date),
            (1 / parseFloat(item.uptimePercentage)) * parseFloat(item.revenue) * 100,
        ]);
        coinPrice.push([new Date(item.time_period_start), item.averagePrice]);
    });

    let totalSales = 0;
    user?.disposals.forEach((item: any) => {    
        totalSales+= item.dollars;
        disposals.push([new Date(item.date), totalSales]);
    });


    // console.log(revenueCume)
    // console.log('sumscoremary', score.getHashrateScoreHistory.nodes)
    return (
        <main>
            <MiningChart
                data={hashRevenue}
                options={{
                    title: "Mining daily stats",
                    series: {
                        0: { targetAxisIndex: 0 },
                        1: { targetAxisIndex: 0 },
                        2: { targetAxisIndex: 0 },
                    },
                    vAxes: {
                        // Adds titles to each axis.
                        0: { title: "$ NZD" },
                    },
                }}
            />
             <MiningChart
                data={hashRevenueCume}
                options={{
                    title: "Mining cumulative stats",
                    series: {
                        0: { targetAxisIndex: 0 },
                        1: { targetAxisIndex: 0 },
                        2: { targetAxisIndex: 0 },
                    },
                    vAxes: {
                        // Adds titles to each axis.
                        0: { title: "$ NZD" },
                    },
                }}
            />
            <MiningChart data={hashUptime} options={{ title: "Miner Daily Uptime %" }} />
            <MiningChart data={relativeMining} options={{ title: "Bitcoin per unit uptime" }} />
            <MiningChart data={coinPrice} options={{ title: "Bitcoin Price" }} />
            <MiningChart data={disposals} options={{ title: "Bitcoin Sales" }} />
        </main>
    );
}
