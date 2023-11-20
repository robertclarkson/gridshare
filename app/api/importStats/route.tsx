import { NextResponse } from "next/server";

import { graphQlClient } from "@/lib/client";
import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

const getHashrateScoreHistory = async (luxor_key: string, subaccount: string) => {
    const query = gql`
        query getHashrateScoreHistory($mpn: MiningProfileName!, $uname: String!, $first: Int) {
            getHashrateScoreHistory(mpn: $mpn, uname: $uname, first: $first, orderBy: DATE_ASC) {
                nodes {
                    date
                    efficiency
                    hashrate
                    revenue
                    uptimePercentage
                    uptimeTotalMinutes
                    uptimeTotalMachines
                }
            }
        }
    `;
    const variables = {
        mpn: "BTC",
        uname: subaccount,
        first: 1000,
    };

    const { data } = await graphQlClient(luxor_key).query({ query, variables });
    return data;
};

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    } else {
        let added = 0;
        let updated = 0;
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId,
            },
        });
        if (user?.luxorApiKey && user?.luxorAccount) {
            const storedHash = await prisma.hashDay.findMany({
                where: {
                    userId: session.userId,
                },
                orderBy: {
                    date: "desc",
                },
            });

            const hashHistory = await getHashrateScoreHistory(user.luxorApiKey, user.luxorAccount);
            const totalHashArray = [...hashHistory.getHashrateScoreHistory.nodes];
            console.log("found hash days: ", totalHashArray.length);
            const nzdBTC = async (from: number, to: number) => {
                return await fetch(
                    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=nzd&from=" +
                        from +
                        "&to=" +
                        to +
                        "&precision=0"
                ).then((result) => {
                    return result.json().then((json) => {
                        if (json.prices) {
                            // console.log("json", json);
                            return json.prices;
                        } else {
                            console.log("No market data", json);
                        }
                    });
                });
            };

            // console.log(
            //     "get prices from ",
            //     new Date(totalHashArray[0].date).valueOf() / 1000,
            //     new Date(totalHashArray[totalHashArray.length - 1].date).valueOf() / 1000
            // );
            const rates = await nzdBTC(
                new Date(totalHashArray[0].date).valueOf() / 1000,
                new Date(totalHashArray[totalHashArray.length - 1].date).valueOf() / 1000
            );
            // console.log(rates);

            const createManyData: any = [];
            totalHashArray.map(async (hash: any) => {
                // const hash = totalHashArray[0];
                const foundHash = storedHash.find((dbHash: any) => {
                    return new Date(hash.date).toISOString() == new Date(dbHash.date).toISOString();
                });
                if (!foundHash) {
                    // console.log("foundHash date", new Date(hash.date).toDateString());
                    const rate = rates.find((item: number[]) => {
                        return item[0] == new Date(hash.date).valueOf();
                    });
                    createManyData.push({
                        date: hash.date,
                        efficiency: parseFloat(hash.efficiency),
                        hashrate: parseFloat(hash.hashrate),
                        revenue: parseFloat(hash.revenue),
                        uptimePercentage: parseFloat(hash.uptimePercentage),
                        uptimeTotalMinutes: parseInt(hash.uptimeTotalMinutes),
                        uptimeTotalMachines: parseInt(hash.uptimeTotalMachines),
                        averagePrice: parseFloat(rate ? rate[1] : 0),
                        userId: user.id,
                    });
                    added++;
                } else {
                    if (foundHash.averagePrice == 0) {
                        // console.log("foundHash date", foundHash.date.toString().substr(0, 10));
                        const rate = rates.find((item: number[]) => {
                            return item[0] == new Date(foundHash.date).valueOf();
                        });
                        // console.log("updating price id", foundHash.id, " with this dates price", rate);
                        if (rate) {
                            await prisma.hashDay.update({
                                where: {
                                    id: foundHash.id,
                                },
                                data: {
                                    averagePrice: rate[1],
                                },
                            });
                        } else {
                            // console.log("todays price cant be found");
                        }
                        updated++;
                    }
                }
            });

            await prisma.hashDay
                .createMany({
                    data: createManyData,
                })
                .catch((error: any) => {
                    console.log("ERROR", error.message);
                    console.log("ERROR", error.response.data);
                });

            console.log("added: ", added, "updated: ", updated);
        }

        return NextResponse.json({ result: "success", added: added, updated: updated });
    }
}
