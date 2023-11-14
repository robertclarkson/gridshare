import { NextResponse } from "next/server";

import { graphQlClient } from "@/lib/client";
import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

const subaccounts = async (luxor_key) => {
    const query = gql`
        query getSubaccounts {
            users(first: 10) {
                nodes {
                    username
                }
            }
        }
    `;

    const { data } = await graphQlClient(luxor_key).query({ query });
    return data;
};

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    } else {
        const result = await prisma.user.findUnique({
            where: {
                id: session.userId,
            },
        });
        let subAcc = [];
        if (result.luxorApiKey) {
            const accounts = await subaccounts(result.luxorApiKey);
            subAcc = accounts.users.nodes.map((user: any, index: number) => user.username);
        }

        return NextResponse.json({ result: { ...result, accounts: subAcc } });
    }
}
export async function POST(request: Request) {
    const { luxorApiKey, minerWatts, electricityPriceUsd, luxorAccount } = await request.json();

    const session = await getServerSession(authOptions);
    const userId = session ? session.userId : null; //find userID

    if (!userId) {
        return NextResponse.json({ error: "Not logged in" });
    }

    const result = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            luxorApiKey: luxorApiKey,
            luxorAccount: luxorAccount,
            minerWatts: minerWatts ? parseInt(minerWatts) : undefined,
            electricityPriceUsd: electricityPriceUsd ? parseFloat(electricityPriceUsd) : undefined,
        },
    });

    return NextResponse.json({ result: "success" });
}
