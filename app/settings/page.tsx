import { Card } from "@nextui-org/card";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import UserSettings from "./UserSettings";
import { authOptions } from "../api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

const getProfile = async (id: string) => {
    const profile = await prisma.user.findUnique({ where: { id: id } });
    return profile;
};

export default async function Settings() {
    // Get user session token
    const session: any = await getServerSession(authOptions);
    if (!session || !session.userId) {
        redirect("/api/auth/signin");
    }
    const profile = await getProfile(session.userId);
    return (
        <div className="bg h-screen">
            <div>
                <h1 className="mb-4 text-center">Settings</h1>
                <div className="flex w-full justify-center items-center">
                    <Card className="max-w-[500px] m-5 p-5">
                        {profile ? <UserSettings /> : <p>You have no profile yet.</p>}
                    </Card>
                </div>
            </div>
        </div>
    );
}
