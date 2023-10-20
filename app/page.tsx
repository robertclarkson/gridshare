

import { getClient } from "@/lib/client";

import { gql } from "@apollo/client";

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
    console.log('sumscoremary', score.getHashrateScoreHistory.nodes)
    return <main>
        {accounts.users.nodes.map(user => {
            return <div>{user.username}</div>
        })}
        {/* {hash.getAllSubaccountsHashrateHistory.edges.map(node => {
            // console.log('node', node.node.username);
            // console.log('node.hashrateHistory', node.node.hashrateHistory);
            return node.node.hashrateHistory.map(history => {
                // console.log('history', history)
                return <div>{history.time} {history.hashrate}</div>
            })
        })} */}
        <table className="">
            <tr>
                <th className="border">date</th>
                <th className="border">efficiency</th>
                <th className="border">hashrate</th>
                <th className="border">revenue</th>
                <th className="border">uptimePercentage</th>
                <th className="border">uptimeTotalMinutes</th>
                <th className="border">uptimeTotalMachines}</th>
            </tr>
            {score.getHashrateScoreHistory.nodes.map(score => {

                return <tr>
                    <td className="border">{score.date}</td>
                    <td className="border">{score.efficiency}</td>
                    <td className="border">{score.hashrate}</td>
                    <td className="border">{score.revenue}</td>
                    <td className="border">{score.uptimePercentage}</td>
                    <td className="border">{score.uptimeTotalMinutes}</td>
                    <td className="border">{score.uptimeTotalMachines}</td>
                </tr>
            })}
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
