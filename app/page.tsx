

import { getClient } from "@/lib/client";

import { gql } from "@apollo/client";
import MiningChart from "./MiningChart";

export default async function Home() {
    const luxor_key = process.env.LUXOR_API_KEY;
    console.log('luxor_key', luxor_key)

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

    const subaccountsHashrateHistory = async () => {
        const query = gql`
            query getAllSubaccountsHashrateHistory (
                $mpn: MiningProfileName, 
                $inputInterval: HashrateIntervals, 
                $first: Int
            ) {
                getAllSubaccountsHashrateHistory(
                    mpn: $mpn, 
                    inputInterval: $inputInterval, 
                    first: $first
                ) {
                    edges {
                        node {
                            hashrateHistory
                            username
                        }
                    }
                }
            }`;
        const variables = {
            mpn: "BTC",
            inputInterval: "_15_MINUTE", //other options are: "_1_HOUR", "_6_HOUR" and "_1_DAY"
            first: 10,
        }

        const { data } = await getClient().query({ query, variables });
        return data;
    }
    const getMiningSummary = async () => {
        const query = gql`
            query getMiningSummary(
                $mpn: MiningProfileName!, 
                $userName: String!, 
                $inputDuration: HashrateIntervals!
            ) {
                getMiningSummary(
                    mpn: $mpn, 
                    userName: $userName, 
                    inputDuration: $inputDuration
                ) {
                    username
                    validShares
                    invalidShares
                    staleShares
                    lowDiffShares
                    badShares
                    duplicateShares
                    revenue
                    hashrate
                }
            }
        `;
        const variables = {
            userName: "onesandzeros",
            mpn: "BTC",
            inputDuration: "_15_MINUTE", //other options are: "_1_HOUR", "_6_HOUR" and "_1_DAY"
        }

        const { data } = await getClient().query({ query, variables });
        return data;
    }

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
    const hash = await subaccountsHashrateHistory();
    const summary = await getMiningSummary();
    const score = await getHashrateScoreHistory();

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
    const hashRevenue = [];
    hashRevenue.push([
        "date", "Mined BTC", "BTC $"
    ])
    const hashUptime = [];
    hashUptime.push([
        "date", "uptimeMinutes"
    ])
    const relativeMining = [];
    relativeMining.push([
        "date", "Bitcoin per unit uptime"
    ])
    let totalRevenue = 0;
    const totalHashArray = [...score.getHashrateScoreHistory.nodes];
    totalHashArray.sort(
        (one: any, two: any) => {
            return new Date(one.date) > new Date(two.date) ? 1 : -1
        }
    )

    const axios = require('axios');
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
    const coinPrice: any[] = [];
    coinPrice.push([
        "date", "BTC/NZD"
    ])
    const allPrices: any[] = [];
    await axios(config)
        .then((response: any) => {
            console.log(JSON.stringify(response.data));
            response.data.forEach((item: any) => {
                coinPrice.push([new Date(item.time_period_start), item.rate_open]);
                allPrices.push({ date: new Date(item.time_period_start), price: item.rate_open })
            })
        })
        .catch((error: any) => {
            console.log('ERROR', error.message);
            console.log('ERROR', error.response.data);
        });

    totalHashArray.forEach((item: any) => {
        // totalRevenue += parseFloat(item.revenue);
        try {
            hashRevenue.push(
                [
                    new Date(item.date),
                    parseFloat(item.revenue),
                    allPrices.find(findit => {
                        // console.log(new Date(item.date).toISOString(), findit.date.toISOString());
                        return new Date(item.date).toISOString() == findit.date.toISOString()
                    }).price * parseFloat(item.revenue)
                ]
            )

        }
        catch (error) {
            console.log(error)
        }
        hashUptime.push(
            [
                new Date(item.date),
                parseFloat(item.uptimePercentage),
            ]
        )
        relativeMining.push(
            [
                new Date(item.date),
                1 / parseFloat(item.uptimePercentage) * parseFloat(item.revenue),
            ]
        )
    })





    // console.log(revenueCume)
    // console.log('sumscoremary', score.getHashrateScoreHistory.nodes)
    return <main>
        {accounts.users.nodes.map((user: any, index: number) => {
            return <div key={index}>{user.username}</div>
        })}
        {/* {hash.getAllSubaccountsHashrateHistory.edges.map(node => {
            // console.log('node', node.node.username);
            // console.log('node.hashrateHistory', node.node.hashrateHistory);
            return node.node.hashrateHistory.map(history => {
                // console.log('history', history)
                return <div>{history.time} {history.hashrate}</div>
            })
        })} */}
        <MiningChart data={hashRevenue} options={{ title: "Bitcoin mined per day" }} />
        <MiningChart data={hashUptime} options={{ title: "Miners Uptime %" }} />
        <MiningChart data={relativeMining} options={{ title: "Bitcoin per unit uptime" }} />
        <MiningChart data={coinPrice} options={{ title: "Bitcoin Price" }} />
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

    </main>;


    // const fetch = require("isomorphic-fetch");

    // const subaccounts = async () => {
    //     const result = await fetch("https://api.beta.luxor.tech/graphql", {
    //         method: "POST",
    //         headers: {
    //             "x-lux-api-key": luxor_key,
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //             query: `

    //       query getSubaccounts {
    //         users(first: 10) {
    //           nodes {
    //             username
    //           }
    //         }
    //       }
    //         `,
    //             variables: null,
    //         }),
    //     });

    //     return await result.json();
    // };
    // const subacc = await subaccounts();
    // console.log('subacc', JSON.stringify(subacc))

    // const subaccountsHashrateHistory = async () => {
    //     const result = await fetch("https://api.beta.luxor.tech/graphql", {
    //         method: "POST",
    //         headers: {
    //             "x-lux-api-key": luxor_key,
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //             query: `
    //     query getAllSubaccountsHashrateHistory (
    //         $mpn: MiningProfileName, 
    //         $inputInterval: HashrateIntervals, 
    //         $first: Int
    //     ) {
    //         getAllSubaccountsHashrateHistory(
    //             mpn: $mpn, 
    //             inputInterval: $inputInterval, 
    //             first: $first
    //         ) {
    //             edges {
    //                 node {
    //                     hashrateHistory
    //                     username
    //                 }
    //             }
    //         }
    //     }
    //     `,
    //             variables: {
    //                 mpn: "BTC",
    //                 inputInterval: "_15_MINUTE", //other options are: "_1_HOUR", "_6_HOUR" and "_1_DAY"
    //                 first: 10,
    //             },
    //         }),
    //     });

    //     return await result.json();
    // };
    // const hash = await subaccountsHashrateHistory();
    // console.log('hash', hash.data.getAllSubaccountsHashrateHistory.edges)
    return (
        <div>
            <h1>Hello, Home page!</h1>
        </div>
    )
}
