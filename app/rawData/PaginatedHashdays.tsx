
"use client";

import { Pagination, Spinner } from "@nextui-org/react";
import { Prisma } from "@prisma/client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";

const limit = 30;

const queryClient = new QueryClient();

export default function PaginatedHashdays() {
    return (
        <QueryClientProvider client={queryClient}>
            <ChildComponent />
        </QueryClientProvider>
    );
}

const ChildComponent = () => {
    const [page, setPage] = useState(1);
    const fetchTransactions = async (page: number) =>
        fetch("/api/storedData?offset=" + (page - 1) * limit + "&limit=" + limit)
            .then(async (res) => {
                const result = await res.json();
                if (result.error) throw new Error(result.error);
                return result.result;
            });
    const { isLoading, isError, error, data, isFetching } = useQuery({
        queryKey: ["transactions", page],
        queryFn: () => fetchTransactions(page),
    });
    if (isLoading) {
        return (
            <div className="text-center">
                <Spinner />
            </div>
        );
    }
    if (isError) {
        return <p>There was a problem fetching the data</p>;
    }

    // useEffect(() => {
    //     console.log(data.data);
    // }, [data]);
    return (

        <main>
            <h1 className="text-2xl my-5">Raw Data</h1>
            <div className="my-4">
                <Pagination total={Math.ceil(data.pagination.total / limit)} page={page} onChange={setPage} />
            </div>
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
                        <th className="border">DR NZD</th>
                        <th className="border">Profit</th>
                        
                    </tr>
                    {data?.data.map((score: Prisma.HashDayGetPayload<{}>, index: number) => {
                        console.log(score);
                        const nzdValue = score.revenue * score.averagePrice;
                        const drValue = (100-score.uptimePercentage) * 32 * 0.05;
                        const elecCost = (score.uptimePercentage) * 32 * 0.12;
                        const profit = nzdValue + drValue - elecCost;
                        return (
                            <tr key={index}>
                                <td className="border">{new Date(score.date).toLocaleDateString()}</td>
                                <td className="border">{score.efficiency}</td>
                                <td className="border">{score.hashrate}</td>
                                <td className="border">{score.revenue}</td>
                                <td className="border">{score.uptimePercentage}</td>
                                <td className="border">{score.uptimeTotalMinutes}</td>
                                <td className="border">{score.uptimeTotalMachines}</td>
                                <td className="border">{score.averagePrice.toLocaleString()}</td>
                                <td className="border">{elecCost.toFixed(2)}</td>
                                <td className="border">{nzdValue.toFixed(2)}</td>
                                <td className="border">{drValue.toFixed(2)}</td>
                                <td className="border">{profit.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                <div className="my-4">
                    <Pagination total={Math.ceil(data.pagination.total / limit)} page={page} onChange={setPage} />
                </div>
            </main>

    );
}