

import { graphQlClient } from "@/lib/client";

import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import MiningChart from "./MiningChart";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const profile = await prisma.user.findUnique({ where: { id: id } });
    return profile;
};
export default async function Home() {
    console.log('Reloading page...')
    const session: any = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return <div>
            <h1>You need to log in first</h1>
        </div>
    }
    const profile = await getUser(session.userId);
    const luxor_key = profile?.luxorApiKey ? profile?.luxorApiKey : null;
    // console.log('luxor_key', luxor_key)
    if (!luxor_key) {
        return <div>
            <h1>Go to the settings and set your Luxor API key</h1>
        </div>
    }

    const luxor_account = profile?.luxorAccount ? profile?.luxorAccount : null;
    if (!luxor_account) {
        return <div>
            <h1>Go to the settings and select your Luxor Account</h1>
        </div>
    }
    //Query for our historical hashrate mining data.
    const getHashrateScoreHistory = async () => {
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
                    orderBy: DATE_DESC
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
            uname: "onesandzeros",
            first: 1000,
        }

        const { data } = await graphQlClient(luxor_key).query({ query, variables });
        return data;
    }

    // const hash = await subaccountsHashrateHistory();
    // const summary = await getMiningSummary();
    const score = await getHashrateScoreHistory();

    //sort the data in date order ascending
    let totalRevenue = 0;
    const totalHashArray = [...score.getHashrateScoreHistory.nodes];
    totalHashArray.sort(
        (one: any, two: any) => {
            return new Date(one.date) > new Date(two.date) ? 1 : -1
        }
    )

    //find the first date of the mining data
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
    //get historical BTC / NZD Prices
    const coinPrice: any[] = [];
    coinPrice.push([
        "date", "BTC/NZD"
    ])
    const allPrices: any[] = [];

    const axios = require('axios');
    await axios(config)
        .then((response: any) => {
            // console.log(JSON.stringify(response.data));
            response.data.forEach((item: any) => {
                coinPrice.push([new Date(item.time_period_start), (item.rate_high + item.rate_low) / 2]);
                allPrices.push({ date: new Date(item.time_period_start), price: (item.rate_high + item.rate_low) / 2 })
            })
        })
        .catch((error: any) => {
            console.log('ERROR', error.message);
            console.log('ERROR', error.response.data);
        });

    //Accumulate the chart data.
    const hashRevenue = [];
    hashRevenue.push([
        "date", "Mined BTC", "BTC value in $", "Electricity cost", "Profit"
    ])
    const hashUptime = [];
    hashUptime.push([
        "date", "uptimeMinutes"
    ])
    const relativeMining = [];
    relativeMining.push([
        "date", "Bitcoin per unit uptime"
    ])

    let totalBitcoin = 0;
    let totalBitcoinValue = 0;
    let totalElec = 0;
    let totalElecCost = 0;
    let totalProfit = 0;
    totalHashArray.forEach((item: any) => {
        console.log(item)
        totalElec += item.uptimeTotalMinutes / 60 * 3.3;
        totalBitcoin += parseFloat(item.revenue);
        //electricity cost = uptime mins / 60 = hrs * 3.3KW * 0.12c/kw
        const elect = item.uptimeTotalMinutes / 60 * 3.3 * 0.12;
        totalElecCost += elect;
        let bitcoinValue = 0;

        let finder = null;
        try {
            bitcoinValue = allPrices.find(findit => {
                finder = { ...findit };
                // console.log(new Date(item.date).toISOString(), findit.date.toISOString());
                return new Date(item.date).toISOString() == findit.date.toISOString()
            }).price * parseFloat(item.revenue)
        }
        catch (error) {
            // console.log(error, "looking for", finder)
        }
        const profit = bitcoinValue - elect;
        totalProfit = totalProfit + profit;
        totalBitcoinValue += bitcoinValue;
        hashRevenue.push(
            [
                new Date(item.date),
                parseFloat(item.revenue),
                bitcoinValue,
                elect,
                profit
            ]
        )
        hashUptime.push(
            [
                new Date(item.date),
                parseFloat(item.uptimePercentage),
            ]
        )
        relativeMining.push(
            [
                new Date(item.date),
                1 / parseFloat(item.uptimePercentage) * parseFloat(item.revenue) * 100,
            ]
        )
    })

    // console.log(revenueCume)
    // console.log('sumscoremary', score.getHashrateScoreHistory.nodes)
    return <main>

        <MiningChart data={hashRevenue} options={{
            title: "Mining daily stats",
            series: {
                0: { targetAxisIndex: 0 },
                1: { targetAxisIndex: 1 },
                2: { targetAxisIndex: 1 },
                3: { targetAxisIndex: 1 }
            },
            vAxes: {
                // Adds titles to each axis.
                0: { title: 'Bitcoin Mined' },
                1: { title: '$ NZD' }
            },
        }} />
        <MiningChart data={hashUptime} options={{ title: "Miner Daily Uptime %" }} />
        <MiningChart data={relativeMining} options={{ title: "Bitcoin per unit uptime" }} />
        <MiningChart data={coinPrice} options={{ title: "Bitcoin Price" }} />


    </main >;

}
