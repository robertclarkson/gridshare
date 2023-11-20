import { graphQlClient } from "@/lib/client";
import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";
import { Card } from "@nextui-org/react";
import Tooltip from "./components/Tooltip";
const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            hashing: {
                orderBy: {
                    date: "asc",
                },
            },
            disposals: true,
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
    if (user?.hashing.length == 0) {
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

    const watts = user?.minerWatts ? user.minerWatts : 0;
    const elec = user?.electricityPriceNzd ? user.electricityPriceNzd : 0;

    let totalBitcoin = 0;
    let totalBitcoinValue = 0;
    let totalElec = 0;
    let totalElecCost = 0;
    let totalProfit = 0;
    let latestBTCPrice = 0;
    user?.hashing.forEach((item: any) => {
        totalElec += ((item.uptimeTotalMinutes / 60) * watts) / 1000;
        totalBitcoin += parseFloat(item.revenue);
        //electricity cost = uptime mins / 60 = hrs * 3.3KW * 0.12c/kw
        const elect = (((item.uptimeTotalMinutes / 60) * watts) / 1000) * elec;
        totalElecCost += elect;
        let bitcoinValue = 0;

        bitcoinValue = item.averagePrice * parseFloat(item.revenue);
        const profit = bitcoinValue - elect;
        totalProfit = totalProfit + profit;
        totalBitcoinValue += bitcoinValue;
        latestBTCPrice = item.averagePrice;
    });

    let totalSalesBTC = 0;
    let totalSalesNZD = 0;
    user?.disposals.forEach((sale) => {
        totalSalesBTC += sale.amount;
        totalSalesNZD += sale.dollars;
    });

    const btcRemaining = totalBitcoin - totalSalesBTC;
    const remBtcValue = btcRemaining > 0 ? btcRemaining * latestBTCPrice : 0;
    const profit = remBtcValue + totalSalesNZD - totalElecCost;
    return (
        <main>
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <h1 className="text-2xl my-5">Mining Summary</h1>
                <table cellPadding={5}>
                    <tbody>
                        <tr>
                            <th className="border">Miner Avg Wattage</th>
                            <td className="border">{watts} watts</td>
                        </tr>
                        <tr>
                            <th className="border">Miner $/KWh</th>
                            <td className="border">${elec} NZD</td>
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
                            <th className="border">
                                Bitcoin Value{" "}
                                <Tooltip
                                    title="Bitcoin Value"
                                    content="Bitcoin is valued at the NZD value at the point at which it was mined."
                                />
                            </th>
                            <td className="border">${parseFloat(totalBitcoinValue.toFixed(2)).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className="border">
                                Theoretical Profit
                                <Tooltip
                                    title="Theoretical Profit"
                                    content="This assumes all the bitcoin mined has been instantly sold at the price of bitcoin on the day it was mined."
                                />
                            </th>

                            <td className="border">${parseFloat(totalProfit.toFixed(2)).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                <table cellPadding={5} className="my-5">
                    <tbody>
                        <tr>
                            <th className="border">Bitcoin Sold</th>
                            <td className="border">{totalSalesBTC} BTC</td>
                        </tr>
                        <tr>
                            <th className="border">Bitcoin Remaining</th>
                            <td className="border">{btcRemaining.toFixed(8)} BTC</td>
                        </tr>
                        <tr>
                            <th className="border">Total Income</th>
                            <td className="border">${totalSalesNZD.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className="border">Remaining BTC Value</th>
                            <td className="border">${remBtcValue.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className="border">Actual Profit</th>
                            <td className="border">${profit.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                <p>&nbsp;</p>
                <p>Most recent reading: {user?.hashing[user?.hashing.length - 1].date.toDateString()}</p>
            </Card>
        </main>
    );
}
