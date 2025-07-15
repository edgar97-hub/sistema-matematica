"use client";

import { useState } from "react";
import { Box, Title, Button, Group, Alert, Text } from "@mantine/core";
import {
  IconWorldPlus,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
  IconEdit,
  IconWorld,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import {
  CountryFE,
  PaginatedCountriesResponse,
} from "../../../../../types/country.types";
import { countryService } from "../../../../../lib/services/country.service";
import { CountryTable } from "../../../../../components/admin/countries/CountryTable";

export default function CountriesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: countriesResponse,
    isError,
    isLoading,
    refetch,
  } = useQuery<PaginatedCountriesResponse | CountryFE[], Error>({
    queryKey: ["countries"],
    queryFn: () => countryService.getCountries(),
  });

  const countries = Array.isArray(countriesResponse)
    ? countriesResponse
    : countriesResponse?.data || [];
  const totalCountries = Array.isArray(countriesResponse)
    ? countriesResponse.length
    : countriesResponse?.total || 0;

  const { mutateAsync: deleteCountryMutation } = useMutation({
    mutationFn: countryService.deleteCountry,
    onSuccess: (_, deletedCountryId) => {
      notifications.show({
        title: "Eliminado",
        message: `ha sido eliminado correctamente.`,
        color: "green",
        icon: <IconTrash size={18} />,
      });
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error al Eliminar",
        message: error.message || "No se pudo eliminar el país.",
        color: "red",
        icon: <IconAlertCircle size={18} />,
      });
    },
  });

  const handleDeleteCountry = async (country: CountryFE) => {
    if (
      window.confirm(`¿Está seguro de que desea eliminar "${country.name}"?`)
    ) {
      await deleteCountryMutation(country.id);
    }
  };

  const handleEditCountry = (country: CountryFE) => {
    router.push(`/admin/educational-content/countries/edit/${country.id}`);
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2} className="page-main-title">
          <IconWorld
            size={28}
            style={{ marginRight: "10px", verticalAlign: "bottom" }}
          />
          Gestión de niveles
        </Title>
        <Group>
          <Button
            onClick={() =>
              router.push("/admin/educational-content/countries/create")
            }
            leftSection={<IconWorldPlus size={18} />}
            variant="filled"
            color="blue"
          >
            Nuevo
          </Button>
          <Button
            onClick={() => refetch()}
            leftSection={<IconRefresh size={18} />}
            variant="default"
            loading={isLoading && countries.length > 0}
            disabled={isLoading && countries.length > 0}
          >
            Refrescar
          </Button>
        </Group>
      </Group>

      {isError && !isLoading && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error de Carga"
          color="red"
          withCloseButton
          mb="md"
        >
          No se pudieron cargar los países.
        </Alert>
      )}

      <CountryTable
        countries={countries}
        isLoading={isLoading}
        onEdit={handleEditCountry}
        onDelete={handleDeleteCountry}
        // Pasa props de paginación si tu tabla y servicio los manejan
        // totalRowCount={totalCountries}
        // pagination={...}
        // onPaginationChange={...}
      />
    </Box>
  );
}
