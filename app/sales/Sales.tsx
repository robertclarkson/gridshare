"use client";
import { Button, Input, Spacer, Spinner, useDisclosure } from "@nextui-org/react";
import { User } from "@prisma/client";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
const dayjs = require("dayjs");
const queryClient = new QueryClient();

export default function UserSettings() {
    return (
        <QueryClientProvider client={queryClient}>
            <UserPanel />
        </QueryClientProvider>
    );
}

interface UsersApiReturnData {
    result: [any];
}

function UserPanel() {
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [saleId, setSaleId] = useState("");
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [amount, setAmount] = useState("");
    const [dollars, setDollars] = useState("");

    const { isLoading, error, data } = useQuery<UsersApiReturnData, AxiosError, UsersApiReturnData>({
        queryKey: ["sales"],
        queryFn: () => fetch("/api/sales").then((res) => res.json()),
    });
    const mutation = useMutation<Response, AxiosError, any, any>({
        mutationFn: (updateSale) => {
            setSaving(true);

            return fetch("/api/sales", { method: "POST", body: JSON.stringify(updateSale) }).then(async (response) => {
                if (!response.ok) {
                    const error = await response.json();
                    throw Error(error.message);
                } else {
                    return response;
                }
            });
        },
        onError: (error, variables, context) => {
            // An error happened!
            console.log(`rolling back optimistic update with id ${context.id}`);
            setSaving(false);
        },
        onSuccess: (data, variables) => {
            //@todo get the sales data refreshing when the data has changed
            console.log("mutation success", data, variables);
            // queryClient.setQueryData(["users", { id: variables.id }], data);
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            setSaving(false);
        },
    });

    const reset = () => {
        setSaleId("");
        setAmount("");
        setDollars("");
        setDate(dayjs().format("YYYY-MM-DD"));
    };
    if (error) return <div>An error has occurred: {error.message}</div>;
    if (isLoading) return <Spinner />;
    if (!data) return <h1>No data returned for this user</h1>;
    return (
        <main className="">
            <Button
                style={{ float: "right" }}
                color="primary"
                onPress={() => {
                    reset();
                    onOpen();
                }}
            >
                Create New
            </Button>
            <h1 className="text-4xl mb-5">Sales</h1>
            <>
                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
                                <ModalBody>
                                    <div>
                                        <div>
                                            <Input
                                                type="date"
                                                label=""
                                                value={date}
                                                onChange={(event) => {
                                                    console.log(event.target.value);
                                                    setDate(event.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <Spacer />
                                    <div>
                                        <div>
                                            <Input
                                                type="text"
                                                label="Amount Bitcoin"
                                                value={amount}
                                                onChange={(event) => setAmount(event.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Spacer />
                                    <div>
                                        <div>
                                            <Input
                                                type="text"
                                                label="Amount Dollars"
                                                value={dollars}
                                                onChange={(event) => setDollars(event.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Spacer />
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        color="danger"
                                        variant="light"
                                        onPress={() => {
                                            reset();
                                            onClose();
                                        }}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={() => {
                                            mutation.mutate({
                                                ...(saleId != null && { id: saleId }),
                                                date: date,
                                                amount: amount,
                                                dollars: dollars,
                                            });
                                        }}
                                    >
                                        Save
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </>
            {data.length == 0 ? (
                <p>No sales data entered yet. Press "create new".</p>
            ) : (
                <table cellPadding="3" cellSpacing="3" className="w-full">
                    <tbody>
                        <tr>
                            <th className="border">Date</th>
                            <th className="border">Amount</th>
                            <th className="border">Dollars</th>
                            <th className="border">Rate</th>
                            <th className="border">actions</th>
                        </tr>
                        {data?.map((sale: any, index: number) => {
                            return (
                                <tr key={index}>
                                    <td className="border">{dayjs(sale.date).format("DD MMM YYYY")}</td>
                                    <td className="border">{sale.amount.toFixed(8)}</td>
                                    <td className="border">${sale.dollars.toLocaleString()}</td>
                                    <td className="border">@ ${((sale.dollars * 1) / sale.amount).toLocaleString()}</td>
                                    <td className="border">
                                        <Button
                                            onPress={() => {
                                                setSaleId(sale.id);
                                                setAmount(sale.amount);
                                                setDollars(sale.dollars);
                                                setDate(dayjs(sale.date).format("YYYY-MM-DD"));
                                                onOpen();
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onPress={() => {
                                                mutation.mutate({
                                                    id: sale.id,
                                                    action: "delete",
                                                });
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </main>
    );
}
