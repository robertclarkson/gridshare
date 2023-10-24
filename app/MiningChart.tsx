"use client"
import { Chart } from "react-google-charts";


export default function MiningChart(props: any) {

    const { data, options } = props;

    return (
        <Chart
            chartType="AreaChart"
            data={data}
            options={options}
            width={"100%"}
            height={"400px"}
        />

    )
}


