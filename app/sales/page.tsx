import { graphQlClient } from "@/lib/client";
import { gql } from "@apollo/client";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { Card } from "@nextui-org/react";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";
import Sales from "./Sales";

const prisma = new PrismaClient();

const getUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            hashing: {
                orderBy: {
                    date: "desc",
                },
            },
        },
    });
    return user;
};
export default async function RawData() {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return (
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <h1>You need to sign in / log in first</h1>
            </Card>
        );
    }
    const user = await getUser(session.userId);
    if (user?.hashing.length == 0) {
        return (
            <Card className="max-w-[500px] m-auto mh-5 p-5">
                <h1>You must pull in some hash data on the settings page</h1>
            </Card>
        );
    }

    return (
        <div className="bg h-screen">
            <div>
                <h1 className="text-2xl mb-4 text-center">Sales</h1>
                <div className="flex w-full justify-center items-center">
                    <Card className="w-1/2 max-w-[500px] m-5 p-5">
                        <Sales />
                    </Card>
                </div>
            </div>
        </div>
    );
}
