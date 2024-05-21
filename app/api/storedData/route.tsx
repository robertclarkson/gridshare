import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    } else {
        const { searchParams } = new URL(request.url);
        let limit = 100;
        let offset = null;
        const passedOffset = searchParams.get("offset");
        const passedLimit = searchParams.get("limit");
        if (passedOffset) {
            if (isNaN(Number(passedOffset))) {
                return NextResponse.json({ error: "Invalid offset value (number)" });
            }
            offset = Number(passedOffset);
        }
        if (passedLimit) {
            if (isNaN(Number(passedLimit))) {
                return NextResponse.json({ error: "Invalid limit value (number)" });
            }
            limit = Number(passedLimit);
            if (limit > 100) {
                return NextResponse.json({ error: "Max limit 100" });
            }
        }
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId,
            },
        });
        if (user?.luxorApiKey && user.luxorAccount) {
            const countHash = await prisma.hashDay.count({
                where: {
                    userId: session.userId,
                },
                orderBy: {
                    date: "desc",
                },
            });
            const storedHash = await prisma.hashDay.findMany({
                where: {
                    userId: session.userId,
                },
                orderBy: {
                    date: "desc",
                },
                ...(limit && { take: limit }),
                ...(offset && { skip: offset }),
            });

            return NextResponse.json({
                result:{
                    data:storedHash,
                    pagination: {
                        total: countHash,
                    },
                }
            });
        }
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    } else {
        const storedHash = await prisma.hashDay.deleteMany({
            where: {
                userId: session.userId,
            },
        });
        return NextResponse.json({ result: "success" });
    }
}
