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
        const user = await prisma.user.findUnique({
            where: {
                id: session.userId,
            },
            include: {
                disposals: {
                    orderBy: {
                        date: "desc",
                    },
                },
            },
        });
        if (user) return NextResponse.json(user?.disposals);
        return NextResponse.json({ result: "no user found" });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    let storedSale;
    if (!session || !session.user) {
        // Not Signed in
        return NextResponse.json({ error: "Not logged in" });
    } else {
        const data: any = await request.json();
        console.log(data);

        if (session.userId) {
            if (data.id) {
                const exists = await prisma.disposal.findUnique({ where: { id: data.id, userId: session.userId } });
                if (exists) {
                    if (data.action && data.action == "delete") {
                        await prisma.disposal.delete({ where: { id: data.id } });
                        return NextResponse.json({ result: "success" });
                    } else {
                        storedSale = await prisma.disposal.update({
                            where: { id: data.id },
                            data: {
                                date: new Date(data.date),
                                amount: parseFloat(data.amount),
                                dollars: parseFloat(data.dollars),
                            },
                        });
                    }
                } else {
                    NextResponse.json({ error: "Record not found" });
                }
            } else {
                if (!data.date || isNaN(data.amount) || isNaN(data.dollars)) {
                    NextResponse.json({ error: "some sale data is missing. fill out all fields" });
                }
                storedSale = await prisma.disposal.create({
                    data: {
                        date: new Date(data.date),
                        amount: parseFloat(data.amount),
                        dollars: parseFloat(data.dollars),
                        userId: session.userId,
                    },
                });
            }
        } else {
            NextResponse.json({ error: "No user available" });
        }
        return NextResponse.json({ result: storedSale });
    }
}
