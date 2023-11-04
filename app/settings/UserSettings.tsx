"use client";
import { Spacer, Spinner } from "@nextui-org/react";
import { User } from "@prisma/client";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import FieldEditor from "./FieldEditor";

const queryClient = new QueryClient();

export default function UserSettings() {
    return (
        <QueryClientProvider client={queryClient}>
            <UserPanel />
        </QueryClientProvider>
    );
}

interface UsersApiReturnData {
    result: User;
}


function UserPanel() {
    const { isLoading, error, data } = useQuery<UsersApiReturnData, AxiosError, UsersApiReturnData>({
        queryKey: ["user"],
        queryFn: () => fetch("/api/settings").then((res) => res.json()),
    });
    const mutation = useMutation<Response, AxiosError, any, any>({
        mutationFn: (updateUser) => {
            return fetch("/api/settings", { method: "POST", body: JSON.stringify(updateUser) }).then(
                async (response) => {
                    if (!response.ok) {
                        const error = await response.json();
                        throw Error(error.message);
                    } else {
                        return response;
                    }
                }
            );
        },
        onError: (error, variables, context) => {
            // An error happened!
            console.log(`rolling back optimistic update with id ${context.id}`);
        },
        onSuccess: (data, variables) => {
            //@todo get the user data refreshing when the data has changed
            console.log("mutation success", data, variables);
            // queryClient.setQueryData(["users", { id: variables.id }], data);
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
    if (error) return "An error has occurred: " + error.message;
    if (isLoading) return <Spinner />;
    if (!data) return <h1>No data returned for this user</h1>

    return (
        <div className="flex flex-col space-y-6">
            <div>
                <label>Luxor API key</label>
                <div>
                    <FieldEditor
                        id={data.result.id}
                        field="luxorApiKey"
                        value={data.result.luxorApiKey}
                        mutation={mutation}
                    />
                </div>
            </div>
            <Spacer />
            <div>
                <label>Luxor Account</label>
                <div>
                    <FieldEditor
                        id={data.result.id}
                        field="luxorAccount"
                        options={data.result.accounts}
                        value={data.result.luxorAccount}
                        mutation={mutation}
                    />
                </div>
            </div>
            <Spacer />
            <div>
                <label>Miner avg watts</label>
                <div>
                    <FieldEditor
                        id={data.result.id}
                        field="minerWatts"
                        value={data.result.minerWatts}
                        mutation={mutation}
                    />
                </div>
            </div>
            <Spacer />
            <div>
                <label>Electricity cost / KWh in USD</label>
                <div>
                    <FieldEditor
                        id={data.result.id}
                        field="electricityPriceUsd"
                        value={data.result.electricityPriceUsd}
                        mutation={mutation}
                    />
                </div>
            </div>
            <Spacer />
        </div>
    );
}
