"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, UserPwa } from "../../../../../store/auth.store";
import { Center, Loader, Text } from "@mantine/core";
import { fetchPwaUserProfile } from "../../../../../lib/services/auth.frontend.service";

const INTENDED_URL_KEY = "intended_pwa_url";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    setUser,
    setLoading,
    setError,
    token: currentTokenInStore,
  } = useAuthStore();

  useEffect(() => {
    if (currentTokenInStore) {
      const user = useAuthStore.getState().user;
      const intendedUrl = sessionStorage.getItem(INTENDED_URL_KEY);
      console.log("intendedUrl", intendedUrl);
      sessionStorage.removeItem(INTENDED_URL_KEY);
      // if (!user?.countryOfOrigin) {
      //   router.replace(
      //     intendedUrl && intendedUrl !== "/set-country"
      //       ? `/set-country?redirect=${encodeURIComponent(intendedUrl)}`
      //       : "/set-country"
      //   );
      // } else {
      //   router.replace(intendedUrl || "/orders");
      // }
      // router.replace(intendedUrl || "/orders");

      return;
    }

    const tokenFromUrl = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      setError(decodedError);
      // router.replace(`/login?error=${encodeURIComponent(decodedError)}`);
      return;
    }

    if (tokenFromUrl) {
      setLoading(true);
      fetchPwaUserProfile(tokenFromUrl)
        .then((userData) => {
          if (userData && userData.id) {
            console.log("GoogleCallback: User profile fetched:", userData);
            setUser(userData, tokenFromUrl);
            const intendedUrl = sessionStorage.getItem(INTENDED_URL_KEY);
            sessionStorage.removeItem(INTENDED_URL_KEY);

            // if (!userData.countryOfOrigin) {
            //   const redirectQuery = intendedUrl
            //     ? `?redirect=${encodeURIComponent(intendedUrl)}`
            //     : "";
            //   router.replace(`/set-country${redirectQuery}`);
            // } else {
            //   router.replace(intendedUrl || "/orders");
            // }
            console.log("intendedUrl", intendedUrl);
            router.replace(intendedUrl || "/orders");
            // router.replace("/orders");
          } else {
            throw new Error("User data not found after login.");
          }
        })
        .catch((err) => {
          console.error(
            "GoogleCallback: Failed to fetch profile or process token:",
            err
          );
          setError(err.message || "Error al obtener información del usuario.");
          useAuthStore.getState().logout();
          localStorage.removeItem("pwa-auth-storage");
          router.replace(
            `/login?error=${encodeURIComponent(
              err.message || "Error al obtener información del usuario."
            )}`
          );
        })
        .finally(() => {
          // setLoading(false); // setUser ya pone isLoading a false
        });
    } else {
      setError("Fallo en la autenticación. No se recibió token.");
      router.replace("/login");
    }
  }, [
    searchParams,
    router,
    setUser,
    setLoading,
    setError,
    currentTokenInStore,
  ]);

  return (
    <Center style={{ height: "100vh", flexDirection: "column" }}>
      <Loader />
      <Text mt="md">Verificando autenticación con Google...</Text>
    </Center>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <Center style={{ height: "100vh" }}>
          <Loader />
        </Center>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
