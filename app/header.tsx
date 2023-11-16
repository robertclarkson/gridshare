"use client";
import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem, User } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { useEffect, useState } from "react";
import UserDropdown from "./components/UserDropdown";

export default function Header(props: any) {
    const { data: session, status } = useSession();
    const [path, setPath] = useState<String>();

    useEffect(() => {
        setPath(window.location.pathname);
    }, []);
    return (
        <Navbar>
            <NavbarBrand>
                <p className="font-bold text-inherit">
                    <a href="/">Mining Stats</a>
                </p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem isActive={path == "/"}>
                    <Link color={path == "/" ? "success" : "foreground"} href="/">
                        Stats
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={path == "/charts"}>
                    <Link color={path == "/charts" ? "success" : "foreground"} aria-current="page" href="/charts">
                        Charts
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={path == "/rawData"}>
                    <Link color={path == "/rawData" ? "success" : "foreground"} aria-current="page" href="/rawData">
                        Raw Data
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={path == "/sales"}>
                    <Link color={path == "/sales" ? "success" : "foreground"} aria-current="page" href="/sales">
                        Sales
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={path == "/settings"}>
                    <Link color={path == "/settings" ? "success" : "foreground"} href="/settings">
                        Settings
                    </Link>
                </NavbarItem>
            </NavbarContent>
            <NavbarContent justify="end">
                {session && <UserDropdown session={session} />}
                {!session && (
                    <NavbarItem>
                        <Button as={Link} color="primary" href="/api/auth/signin" variant="flat">
                            Sign Up
                        </Button>
                    </NavbarItem>
                )}
            </NavbarContent>
        </Navbar>
    );
}
