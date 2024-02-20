"use client";
import { useState } from "react";
import MiningChart from "./MiningChart";

export default async function ChartsContainer() {
    const [start, setStart] = useState(new Date().toISOString().split("T")[0]);
    const [end, setEnd] = useState(new Date().toISOString().split("T")[0]);

    return (
        <div>
            <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
            <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />

            <MiningChart
                data={hashRevenue}
                options={{
                    title: "Mining daily stats",
                    series: {
                        0: { targetAxisIndex: 0 },
                        1: { targetAxisIndex: 1 },
                        2: { targetAxisIndex: 1 },
                        3: { targetAxisIndex: 1 },
                    },
                    vAxes: {
                        // Adds titles to each axis.
                        0: { title: "Bitcoin Mined" },
                        1: { title: "$ NZD" },
                    },
                }}
            />
            <MiningChart data={hashUptime} options={{ title: "Miner Daily Uptime %" }} />
            <MiningChart data={relativeMining} options={{ title: "Bitcoin per unit uptime" }} />
            <MiningChart data={coinPrice} options={{ title: "Bitcoin Price" }} />
        </div>
    );
}
