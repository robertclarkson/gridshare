

import { getClient } from "@/lib/client";

import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const profile = await prisma.user.findUnique({ where: { id: id } });
    return profile;
};
export default async function Home() {
    console.log('Reloading page...')
    const luxor_key = process.env.LUXOR_API_KEY;
    // console.log('luxor_key', luxor_key)

    const subaccounts = async () => {
        const query = gql`
            query getSubaccounts {
                users(first: 10) {
                    nodes {
                        username
                    }
                }
            }`;

        const { data } = await getClient().query({ query });
        return data;
    }

    // const subaccountsHashrateHistory = async () => {
    //     const query = gql`
    //         query getAllSubaccountsHashrateHistory (
    //             $mpn: MiningProfileName, 
    //             $inputInterval: HashrateIntervals, 
    //             $first: Int
    //         ) {
    //             getAllSubaccountsHashrateHistory(
    //                 mpn: $mpn, 
    //                 inputInterval: $inputInterval, 
    //                 first: $first
    //             ) {
    //                 edges {
    //                     node {
    //                         hashrateHistory
    //                         username
    //                     }
    //                 }
    //             }
    //         }`;
    //     const variables = {
    //         mpn: "BTC",
    //         inputInterval: "_15_MINUTE", //other options are: "_1_HOUR", "_6_HOUR" and "_1_DAY"
    //         first: 10,
    //     }

    //     const { data } = await getClient().query({ query, variables });
    //     return data;
    // }
    // const getMiningSummary = async () => {
    //     const query = gql`
    //         query getMiningSummary(
    //             $mpn: MiningProfileName!, 
    //             $userName: String!, 
    //             $inputDuration: HashrateIntervals!
    //         ) {
    //             getMiningSummary(
    //                 mpn: $mpn, 
    //                 userName: $userName, 
    //                 inputDuration: $inputDuration
    //             ) {
    //                 username
    //                 validShares
    //                 invalidShares
    //                 staleShares
    //                 lowDiffShares
    //                 badShares
    //                 duplicateShares
    //                 revenue
    //                 hashrate
    //             }
    //         }
    //     `;
    //     const variables = {
    //         userName: "onesandzeros",
    //         mpn: "BTC",
    //         inputDuration: "_15_MINUTE", //other options are: "_1_HOUR", "_6_HOUR" and "_1_DAY"
    //     }

    //     const { data } = await getClient().query({ query, variables });
    //     return data;
    // }

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

        const { data } = await getClient().query({ query, variables });
        return data;
    }

    const accounts = await subaccounts();
    // const hash = await subaccountsHashrateHistory();
    // const summary = await getMiningSummary();
    const score = await getHashrateScoreHistory();



    // const hashData = [];
    // hashData.push([
    //     "date", "efficiency", "hashrate", "revenue", "uptimePercent", "uptimeMinutes", "uptimeMachines"
    // ])
    // score.getHashrateScoreHistory.nodes.forEach((item: any) => {
    //     hashData.push(
    //         [
    //             new Date(item.date),
    //             parseFloat(item.efficiency),
    //             parseFloat(item.hashrate),
    //             parseFloat(item.revenue),
    //             parseFloat(item.uptimePercentage),
    //             parseInt(item.uptimeTotalMinutes),
    //             parseInt(item.uptimeTotalMachines),
    //         ]
    //     )
    // })

    // {
    //     __typename: 'ReturnHashrateScoreHistory',
    //     date: '2023-08-19T00:00:00+00:00',
    //     efficiency: '99.9008',
    //     hashrate: '3288096852941646.5067',
    //     revenue: '0.00801414',
    //     uptimePercentage: '99.13',
    //     uptimeTotalMinutes: '38542',
    //     uptimeTotalMachines: '27'
    //   },

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
        {/* {hash.getAllSubaccountsHashrateHistory.edges.map(node => {
            // console.log('node', node.node.username);
            // console.log('node.hashrateHistory', node.node.hashrateHistory);
            return node.node.hashrateHistory.map(history => {
                // console.log('history', history)
                return <div>{history.time} {history.hashrate}</div>
            })
        })} */}
        <table cellPadding={5}>
            <tbody>
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

                    return <tr key={index}>
                        <td className="border">{score.date}</td>
                        <td className="border">{score.efficiency}</td>
                        <td className="border">{score.hashrate}</td>
                        <td className="border">{score.revenue}</td>
                        <td className="border">{score.uptimePercentage}</td>
                        <td className="border">{score.uptimeTotalMinutes}</td>
                        <td className="border">{score.uptimeTotalMachines}</td>
                    </tr>
                })}
            </tbody>
        </table>

    </main >;

}
