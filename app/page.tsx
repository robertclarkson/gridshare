import { graphQlClient } from "@/lib/client";
import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { Card } from "@nextui-org/react";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            HashDay: {
                orderBy: {
                    date: "asc",
                },
            },
        },
    });
    return user;
};
export default async function Home() {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return (
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <h1>You need to sign in / log in first</h1>
            </Card>
        );
    }
    const user = await getUser(session.userId);
    if (user?.HashDay.length == 0) {
        return (
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <h1>You must pull in some hash data on the settings page</h1>
            </Card>
        );
    }

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
    user?.HashDay.forEach((item: any) => {
        console.log(item.revenue);
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
    });

    return (
        <main>
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <table cellPadding={5}>
                    <tbody>
                        <tr>
                            <th className="border">Miner Avg Wattage</th>
                            <td className="border">{user?.minerWatts ? user?.minerWatts : "?"} watts</td>
                        </tr>
                        <tr>
                            <th className="border">Miner $/KWh</th>
                            <td className="border">
                                ${user?.electricityPriceNzd ? user?.electricityPriceNzd : "?"} NZD
                            </td>
                        </tr>
                        <tr>
                            <th className="border">Total Bitcoin Mined</th>
                            <td className="border">{totalBitcoin.toFixed(8)}</td>
                        </tr>
                        <tr>
                            <th className="border">Total Electricity Used</th>
                            <td className="border">{parseFloat(totalElec.toFixed(2)).toLocaleString()} KWh</td>
                        </tr>
                        <tr>
                            <th className="border">Total Electricity Cost</th>
                            <td className="border">${parseFloat(totalElecCost.toFixed(2)).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className="border">Approx Bitcoin Value</th>
                            <td className="border">${parseFloat(totalBitcoinValue.toFixed(2)).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className="border">Theoretical Profit</th>
                            <td className="border">${parseFloat(totalProfit.toFixed(2)).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                <p>&nbsp;</p>
                <p>Most recent reading: {user?.HashDay[user?.HashDay.length - 1].date.toDateString()}</p>
            </Card>
            {/* 
            <table className="">
                <tbody>
                    <tr>
                        <th className="border">date</th>
                        <th className="border">efficiency</th>
                        <th className="border">hashrate</th>
                        <th className="border">revenue</th>
                        <th className="border">uptimePercentage</th>
                        <th className="border">uptimeTotalMinutes</th>
                        <th className="border">uptimeTotalMachines</th>
                    </tr>
                    {score.getHashrateScoreHistory.nodes.map((score: any, index: number) => {
                        return (
                            <tr key={index}>
                                <td className="border">{score.date}</td>
                                <td className="border">{score.efficiency}</td>
                                <td className="border">{score.hashrate}</td>
                                <td className="border">{score.revenue}</td>
                                <td className="border">{score.uptimePercentage}</td>
                                <td className="border">{score.uptimeTotalMinutes}</td>
                                <td className="border">{score.uptimeTotalMachines}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table> */}
        </main>
    );
}
