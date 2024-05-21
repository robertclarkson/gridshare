import { Card } from "@nextui-org/react";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            hashing: {
                orderBy: {
                    date: "desc",
                },
            },
        },
    });
    return user;
};
export default async function RawData() {
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

    return (
        <main>
            <h1 className="text-2xl my-5">Raw Data</h1>
            <table cellPadding="3" cellSpacing="3" className="">
                <tbody>
                    <tr>
                        <th className="border">Date</th>
                        <th className="border">Efficiency</th>
                        <th className="border">Hashrate</th>
                        <th className="border">Revenue</th>
                        <th className="border">Uptime %</th>
                        <th className="border">Uptime mins</th>
                        <th className="border">Machines</th>
                        <th className="border">NZD Price</th>
                        <th className="border">Elec Cost</th>
                        <th className="border">Mined NZD</th>
                        <th className="border">Profit</th>
                        <th className="border">DR NZD</th>
                        
                    </tr>
                    {user?.hashing.map((score: any, index: number) => {
                        const nzdValue = score.revenue * score.averagePrice;
                        const drValue = (100-score.uptimePercentage) * 32 * 0.05;
                        const elecCost = (score.uptimePercentage) * 32 * 0.12;
                        const profit = nzdValue - elecCost;
                        return (
                            <tr key={index}>
                                <td className="border">{score.date.toLocaleDateString()}</td>
                                <td className="border">{score.efficiency}</td>
                                <td className="border">{score.hashrate}</td>
                                <td className="border">{score.revenue}</td>
                                <td className="border">{score.uptimePercentage}</td>
                                <td className="border">{score.uptimeTotalMinutes}</td>
                                <td className="border">{score.uptimeTotalMachines}</td>
                                <td className="border">{score.averagePrice.toLocaleString()}</td>
                                <td className="border">{elecCost.toFixed(2)}</td>
                                <td className="border">{nzdValue.toFixed(2)}</td>
                                <td className="border">{profit.toFixed(2)}</td>
                                <td className="border">{drValue.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    );
}
