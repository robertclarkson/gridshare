"use client";

import React from "react";
import { Button, Link } from "@nextui-org/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { User } from "@nextui-org/user";
import { ThemeSwitcher } from "./ThemeSwitcher";

export default function UserDropdown(props: any) {
    const { session } = props;
    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="bordered">
                        <User
                            id="user"
                            name={session.user.name}
                            description={session.user.email}
                            avatarProps={{
                                src: session.user.image,
                            }}
                        />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                    <DropdownItem key="signout">
                        <ThemeSwitcher />
                    </DropdownItem>
                    <DropdownItem key="signout">
                        <Link href="/api/auth/signout" className="m-0 block h-full w-full">
                            Sign out
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </>
    );
}
