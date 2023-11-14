"use client";
import { Button, Input, Link, Select, SelectItem, Spinner } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function FieldEditor(props: any) {
    const { value, valueText, mutation, id, field, type, options } = props;
    const [editingMode, setEditingMode] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState(value);
    useEffect(() => {
        if (mutation.isSuccess) setEditingMode(false);
    }, [mutation.isSuccess]);

    return editingMode ? (
        <>
            {type == "boolean" ? (
                <Input
                    type="checkbox"
                    checked={inputValue}
                    onClick={(event) => {
                        setInputValue(!inputValue);
                    }}
                />
            ) : options?.length > 0 ? (
                <Select
                    label={"Select " + field}
                    className="max-w-xs"
                    onSelectionChange={(selectedOption: any) => {
                        mutation.mutate({ id: id, [field]: selectedOption.currentKey });
                        setEditingMode(false);
                    }}
                >
                    {options.map((option: any) => (
                        <SelectItem style={{ color: "black" }} key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </Select>
            ) : (
                <Input
                    type="text"
                    value={inputValue}
                    onChange={(event) => {
                        setInputValue(event.target.value);
                    }}
                />
            )}
            {options?.length == 0 && (
                <>
                    <Button
                        onPress={() => {
                            mutation.mutate({ id: id, [field]: inputValue });
                            setEditingMode(false);
                        }}
                    >
                        Save
                    </Button>
                </>
            )}

            <Button
                onPress={() => {
                    setInputValue(value);
                    setEditingMode(false);
                }}
            >
                Cancel
            </Button>
            {mutation.isLoading && "Saving..."}
        </>
    ) : (
        <>
            <Link
                style={{ cursor: "pointer" }}
                onClick={() => {
                    setEditingMode(true);
                }}
            >
                {mutation.isLoading && <Spinner />}
                {valueText != null && valueText != "" ? (
                    valueText
                ) : value != null && value != "" ? (
                    value
                ) : (
                    <span className="bg-blue-500 hover:bg-blue-700 text-white font-bold  border border-blue-700 rounded">
                        Edit
                    </span>
                )}
            </Link>
        </>
    );
}
