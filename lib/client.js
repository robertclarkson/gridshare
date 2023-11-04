// lib/client.js
import { HttpLink } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";
import {
    NextSSRApolloClient,
    NextSSRInMemoryCache,
} from "@apollo/experimental-nextjs-app-support/ssr";

export const graphQlClient = (luxor_key) => {
    const { getClient } = registerApolloClient(() => {
        return new NextSSRApolloClient({
            cache: new NextSSRInMemoryCache(),
            link: new HttpLink({
                uri: "https://api.beta.luxor.tech/graphql",
                headers: {
                    "x-lux-api-key": luxor_key,
                    "Content-Type": "application/json",
                }
            }),
        });
    });
    return getClient();
}