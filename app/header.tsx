"use client";
import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem, User } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

export default function Header(props: any) {
    const { data: session, status } = useSession();

    return (
        <Navbar>
            <NavbarBrand>
                <p className="font-bold text-inherit">Mining Stats</p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link color="foreground" href="/">
                        Stats
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link aria-current="page" href="/charts">
                        Charts
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="/settings">
                        Settings
                    </Link>
                </NavbarItem>
            </NavbarContent>
            <NavbarContent justify="end">
                <ThemeSwitcher />
                {session && (
                    <User
                        id="user"
                        name={session.user?.name}
                        description={session.user?.email}
                        avatarProps={{
                            src: session.user?.image ? session.user?.image : undefined,
                        }}
                    />
                )}
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
