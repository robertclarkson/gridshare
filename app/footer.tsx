"use client";
import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem, User } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

export default function Header(props: any) {
    const { data: session, status } = useSession();

    return (
        <div className="m-auto mv-5 text-center">
            <p>
                <a href="https://onesandzeros.nz">Built by Ones and Zeros</a>
                <br />
                <small>
                    <a href="https://coingecko.com">Price Data provided by CoinGecko</a>
                </small>
            </p>
        </div>
    );
}
