
import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

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
            return NextResponse.json(storedHash);

        }
    }
}