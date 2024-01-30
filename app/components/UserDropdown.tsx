"use client";

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Link } from "@nextui-org/react";
import { User } from "@nextui-org/user";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export default function UserDropdown(props: any) {
    const { session } = props;
    const [path, setPath] = useState<String>();

    useEffect(() => {
        setPath(window.location.pathname);
    }, []);
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
                    <DropdownItem>
                        <Link color={path == "/" ? "success" : "foreground"} href="/">
                            Stats
                        </Link>
                    </DropdownItem>
                    <DropdownItem>
                        <Link color={path == "/charts" ? "success" : "foreground"} aria-current="page" href="/charts">
                            Charts
                        </Link>
                    </DropdownItem>
                    <DropdownItem>
                        <Link color={path == "/rawData" ? "success" : "foreground"} aria-current="page" href="/rawData">
                            Raw Data
                        </Link>
                    </DropdownItem>
                    <DropdownItem>
                        <Link color={path == "/sales" ? "success" : "foreground"} aria-current="page" href="/sales">
                            Sales
                        </Link>
                    </DropdownItem>
                    <DropdownItem>
                        <Link color={path == "/settings" ? "success" : "foreground"} href="/settings">
                            Settings
                        </Link>
                    </DropdownItem>
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
