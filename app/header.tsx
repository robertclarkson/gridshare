
"use client"
import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem, User } from "@nextui-org/react";
import { useSession } from "next-auth/react";

export default function Header(props) {
    const { data: session, status } = useSession()

    return (
        <Navbar>
            <NavbarBrand>
                <p className="font-bold text-inherit">Mining Stats</p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Features
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link href="#" aria-current="page">
                        Customers
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
            </NavbarContent>
            <NavbarContent justify="end">
                {session && (
                    <User
                        id="user"
                        name={session.user?.name}
                        description={session.user?.email}
                        avatarProps={{
                            src: session.user?.image,
                        }}
                    />
                )}
                {!session && (
                    <NavbarItem>
                        <Button
                            as={Link}
                            color="primary"
                            href="/api/auth/signin"
                            variant="flat"
                        >
                            Sign Up
                        </Button>
                    </NavbarItem>
                )}



            </NavbarContent>
        </Navbar>
    );
}