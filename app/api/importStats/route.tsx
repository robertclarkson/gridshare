
import { NextResponse } from "next/server";

import { graphQlClient } from "@/lib/client";
import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

const getHashrateScoreHistory = async (luxor_key: string, subaccount: string) => {
    const query = gql`
        query getHashrateScoreHistory(
            $mpn: MiningProfileName!, 
            $uname: String!, 
            $first : Int
        ) {
            getHashrateScoreHistory(
                mpn: $mpn, 
                uname: $uname, 
                first: $first, 
                orderBy: DATE_ASC
            ) {
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
    }

    const { data } = await graphQlClient(luxor_key).query({ query, variables });
    return data;
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    } else {
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId,
            },
        });
        if (user.luxorApiKey && user.luxorAccount) {
            const storedHash = await prisma.HashDay.findMany({
                where: {
                    userId: session.userId,
                },
                orderBy: {
                    date: 'desc'
                }
            });
            console.log('found records: ', storedHash.length)

            const hashHistory = await getHashrateScoreHistory(user.luxorApiKey, user.luxorAccount);
            const totalHashArray = [...hashHistory.getHashrateScoreHistory.nodes];

            const startDateISO = new Date(totalHashArray[0].date).toISOString()
            console.log('First Date = ', startDateISO)

            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://rest.coinapi.io/v1/exchangerate/BTC/NZD/history?period_id=1DAY&time_start=' + startDateISO + '&limit=' + totalHashArray.length,
                headers: {
                    'Accept': 'application/json',
                    'X-CoinAPI-Key': '46CB7B06-7BFF-4D44-BD58-7E181FD37D63'
                }
            };
            const axios = require('axios');
            const coinPrice = [];
            await axios(config)
                .then((response: any) => {
                    // console.log(JSON.stringify(response.data));
                    response.data.forEach((item: any) => {
                        coinPrice.push([new Date(item.time_period_start), (item.rate_high + item.rate_low) / 2]);
                    })
                })
                .catch((error: any) => {
                    console.log('ERROR', error.message);
                    console.log('ERROR', error.response.data);
                });

            console.log
            totalHashArray.forEach((hash: any) => {
                // const hash = totalHashArray[0];
                const foundHash = storedHash.find((dbHash: any) => {
                    return new Date(hash.date).toISOString() == new Date(dbHash.date).toISOString()
                });
                if (!foundHash) {
                    console.log('hash not found hash.date == dbHash.date', hash.date)
                    const todaysPrice = coinPrice.find(price => {
                        return price[0] == new Date(hash.date)
                    })
                    prisma.hashDay.create({
                        data: {
                            date: hash.date,
                            efficiency: parseFloat(hash.efficiency),
                            hashrate: parseFloat(hash.hashrate),
                            revenue: parseFloat(hash.revenue),
                            uptimePercentage: parseFloat(hash.uptimePercentage),
                            uptimeTotalMinutes: parseInt(hash.uptimeTotalMinutes),
                            uptimeTotalMachines: parseInt(hash.uptimeTotalMachines),
                            averagePrice: parseFloat(todaysPrice ? todaysPrice[1] : 0),
                            userId: user.id
                        },
                    })
                        .catch((error: any) => {
                            console.log('ERROR', error.message);
                            console.log('ERROR', error.response.data);
                        });

                }
                else {
                    if (foundHash.averagePrice == 0) {
                        const todaysPrice = coinPrice.find(price => {
                            // console.log((price[0]).toISOString(), new Date(hash.date).toISOString())
                            return new Date(price[0]).toISOString() == new Date(hash.date).toISOString()
                        })
                        console.log('updating price id', foundHash.id, ' with this dates price', todaysPrice);
                        if (todaysPrice) {
                            prisma.HashDay.update({
                                where: {
                                    id: foundHash.id,
                                },
                                data: {
                                    averagePrice: todaysPrice[1]
                                }
                            });
                        }
                        else {
                            console.log('todays price cant be found')
                        }
                    }
                }
            })
        }

        return NextResponse.json({ result: "success" });
    }
}