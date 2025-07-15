// src/app/payment/layout.tsx
"use client";
import React from "react";
import { Box, Center } from "@mantine/core";
// Puedes crear un classes.paymentLayoutWrapper si necesitas estilos específicos
// import classes from './payment-layout.module.css';

export default function PaymentPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "var(--mantine-color-gray-0)",
      }}
    >
      {/* :global(body.dark-theme) & { background-color: var(--mantine-color-dark-8); } */}
      {children}
    </Box>
  );
}
