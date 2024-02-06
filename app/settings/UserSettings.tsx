"use client";
import { Button, Link, Spacer, Spinner } from "@nextui-org/react";
import { User } from "@prisma/client";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import FieldEditor from "./FieldEditor";
import { useState } from "react";
import { Divider } from "@nextui-org/react";
import Tooltip from "../components/Tooltip";
const queryClient = new QueryClient();

export default function UserSettings() {
    return (
        <QueryClientProvider client={queryClient}>
            <UserPanel />
        </QueryClientProvider>
    );
}

interface UsersApiReturnData {
    result: any;
}

function UserPanel() {
    const [saving, setSaving] = useState(false);
    const [update, setUpdate] = useState<string | null>();
    const [importing, setImporting] = useState(false);
    const { isLoading, error, data } = useQuery<UsersApiReturnData, AxiosError, UsersApiReturnData>({
        queryKey: ["user"],
        queryFn: () => fetch("/api/settings").then((res) => res.json()),
    });
    const mutation = useMutation<Response, AxiosError, any, any>({
        mutationFn: (updateUser) => {
            setSaving(true);

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
            setSaving(false);
        },
        onSuccess: (data, variables) => {
            //@todo get the user data refreshing when the data has changed
            console.log("mutation success", data, variables);
            // queryClient.setQueryData(["users", { id: variables.id }], data);
            queryClient.invalidateQueries({ queryKey: ["user"] });
            setSaving(false);
        },
    });
    if (error) return <div>An error has occurred: {error.message}</div>;
    if (isLoading) return <Spinner />;
    if (!data) return <h1>No data returned for this user</h1>;
    const disabled = !data.result.luxorApiKey || !data.result.luxorAccount;
    console.log("disabled", disabled);
    return (
        <div className="flex flex-col space-y-6">
            {saving && <Spinner />}
            <div>
                <label>Luxor API key</label>
                <p>
                    <Link target="_new" className="text-xs" href="https://app.luxor.tech/account/keys">
                        Generate a read-only key here
                    </Link>
                </p>
                <div>
                    <FieldEditor
                        id={data.result.id}
                        field="luxorApiKey"
                        value={data.result.luxorApiKey}
                        mutation={mutation}
                    />
                </div>
            </div>
            <Divider />
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
            <Divider />
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
            <Divider />
            <div>
                <label>Electricity cost / KWh in NZD</label>
                <div>
                    <FieldEditor
                        id={data.result.id}
                        field="electricityPriceNzd"
                        value={data.result.electricityPriceNzd}
                        mutation={mutation}
                    />
                </div>
            </div>
            <Divider />
            <div>
                <label>
                    Capex{" "}
                    <Tooltip
                        title="Capital Expenditure"
                        content="What you spent on mining equipment minus GST. Only required if you want to see time to ROI"
                    />
                </label>

                <div>
                    $<FieldEditor id={data.result.id} field="capex" value={data.result.capex} mutation={mutation} />
                </div>
            </div>
            <Divider />
            <div>
                <label>Actions</label>
                <div>
                    <p>Current Records #{data.result.hashing.length}</p>
                    {update && <p>{update}</p>}
                    {importing && <Spinner />}
                    <Button
                        disabled={disabled}
                        onPress={() => {
                            setImporting(true);
                            setUpdate(null);
                            fetch("/api/importStats", {
                                method: "GET",
                            })
                                .then(async (response: any) => {
                                    queryClient.invalidateQueries({ queryKey: ["user"] });
                                    setImporting(false);
                                    const data = await response.json();
                                    setUpdate(
                                        "added: " + data.added + " updated: " + data.updated + " missed: " + data.missed
                                    );
                                })
                                .catch((error) => {
                                    alert(error.message);
                                    setImporting(false);
                                    setUpdate(null);
                                });
                        }}
                    >
                        Import Hash Data
                    </Button>
                    <Button
                        disabled={disabled}
                        onPress={() => {
                            fetch("/api/storedData", {
                                method: "POST",
                            })
                                .then(async (response) => {
                                    queryClient.invalidateQueries({ queryKey: ["user"] });
                                    const data = await response.json();
                                    setUpdate(
                                        "added: " + data.added + " updated: " + data.updated + " missed: " + data.missed
                                    );
                                })
                                .catch((error) => {
                                    alert(error.message);
                                });
                        }}
                    >
                        Clear All Hash Data
                    </Button>
                </div>
            </div>
        </div>
    );
}
