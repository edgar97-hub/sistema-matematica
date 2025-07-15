"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Title,
  Paper,
  LoadingOverlay,
  Alert,
  Group,
  Button,
  Text,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

import { UserPwaFE } from "../../../../../../types/user.types"; // Ajusta ruta
import { pwaUserService } from "../../../../../../lib/services/pwa-user.service"; // Ajusta ruta
// Necesitarás un componente de formulario UserPwaFormComponent
import {
  UserPwaFormComponent,
  UserPwaFormData,
} from "../../../../../../components/admin/pwa-users/UserPwaFormComponent"; // Ajusta ruta

export default function EditPwaUserPage() {
  // const router = useRouter();
  // const params = useParams();
  // // const userId = params.id as string; // El [id] de la ruta
  // const queryClient = useQueryClient();
  // // Asegúrate de que userId sea realmente un string y no un array o undefined
  // let userId: string | undefined = undefined;
  // if (params.id) {
  //   if (Array.isArray(params.id)) {
  //     userId = params.id[0]; // Toma el primer elemento si es un array (improbable para /edit/[id])
  //   } else {
  //     userId = params.id;
  //   }
  // }
  // console.log(
  //   "EditPwaUserPage - Extracted userId:",
  //   userId,
  //   "Type:",
  //   typeof userId
  // ); // LOG DETALLADO

  const [initialFormData, setInitialFormData] =
    useState<UserPwaFormData | null>(null);

  // const queryIsEnabled = typeof userId === "string" && userId.length > 0;
  // console.log("EditPwaUserPage - Query enabled state:", queryIsEnabled); // LOG DEL ESTADO ENABLED

  // const {
  //   data: user,
  //   isLoading: isLoadingUser,
  //   isError,
  //   error,
  //   status, // Añadir status para más info de React Query
  // } = useQuery<UserPwaFE, Error>({
  //   queryKey: ["pwa-user", userId], // userId aquí puede ser undefined inicialmente, pero está bien para la key
  //   queryFn: async () => {
  //     // Marcar como async si pwaUserService.getUserById es async
  //     console.log("useQuery - queryFn EXECUTING with userId:", userId); // ESTE LOG ES CLAVE
  //     if (!userId) {
  //       console.error(
  //         "useQuery - queryFn: userId is UNDEFINED at execution time. This shouldn't happen if 'enabled' is working."
  //       );
  //       return Promise.reject(new Error("User ID is missing for queryFn"));
  //     }
  //     return pwaUserService.getUserById(userId);
  //   },
  //   enabled: queryIsEnabled, // Usa la variable calculada
  // });

  // useEffect(() => {
  //   if (user) {
  //     let data: any = user;
  //     setInitialFormData({
  //       name: data.name,
  //       email: data.email,
  //       countryOfOrigin: data.countryOfOrigin || "",
  //       credits: data.credits,
  //       isActive: data.isActive,
  //     });
  //     // notifications.show({
  //     //   title: "Usuario Actualizado",
  //     //   message: `Los datos de han sido actualizados.`,
  //     //   color: "green",
  //     // });
  //   }
  // }, [user]);

  const router = useRouter();
  const params = useParams();
  const userId = params.id as string; // El [id] de la ruta
  const queryClient = useQueryClient();

  // Query para obtener los datos del paquete a editar
  const {
    data: user,
    isLoading: isLoadingUser,
    isError,
    error,
    refetch, // Para el botón de descartar
  } = useQuery<UserPwaFE, Error>({
    queryKey: ["pwa-user", userId],
    queryFn: () => pwaUserService.getUserById(userId),
    enabled: !!userId, // Solo ejecuta si hay packageId
    // staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutación para actualizar el paquete
  const { mutateAsync: updateUserMutation, isPending } = useMutation({
    mutationFn: (
      formData: UserPwaFormData // El servicio espera UpdateCreditPackageData
    ) =>
      pwaUserService.updateUser(
        userId,
        formData as Partial<Omit<UserPwaFE, "id" | "createdAt" | "updatedAt">>
      ),
    onSuccess: (updatedPackage) => {
      notifications.show({
        title: "Usuario Actualizado",
        message: `El usuario "${updatedPackage.name}" ha sido actualizado exitosamente.`,
        color: "green",
        icon: <IconDeviceFloppy size={18} />,
      });
      // queryClient.invalidateQueries({ queryKey: ["pwa-users"] }); // Invalida la lista
      // queryClient.setQueryData(["pwa-users", userId], updatedPackage); // Actualiza el caché de este item

      queryClient.invalidateQueries({ queryKey: ["pwa-users"] }); // Para la lista de países
      queryClient.invalidateQueries({ queryKey: ["pwa-user", userId] }); // Para este detalle
      // queryClient.invalidateQueries()
      // queryClient.removeQueries("pwa-users-");
      // queryClient.removeQueries();

      router.push("/admin/users-pwa"); // Volver a la lista
    },
    onError: (err: any) => {
      notifications.show({
        title: "Error al Actualizar",
        message: err.message || "No se pudo actualizar el paquete de crédito.",
        color: "red",
        icon: <IconAlertCircle size={18} />,
      });
    },
  });

  const handleFormSubmit = async (formData: UserPwaFormData) => {
    await updateUserMutation(formData);
  };

  console.log("user", user);
  // Prepara initialData para el formulario una vez que currentPackage esté disponible
  // const initialFormData: any = {
  //   name: user.name,
  //   description: user.description || null,
  //   creditAmount: currentPackage.credit_amount || 0,
  //   // credit_amount: currentPackage.credit_amount,
  //   price: currentPackage.price,
  //   isActive: currentPackage.is_active,
  // };

  useEffect(() => {
    if (user) {
      let data: any = user;
      setInitialFormData({
        name: data.name,
        email: data.email,
        countryOfOrigin: data.countryOfOrigin || "",
        credits: 0,
        isActive: data.isActive,
      });
      // notifications.show({
      //   title: "Usuario Actualizado",
      //   message: `Los datos de han sido actualizados.`,
      //   color: "green",
      // });
    }
  }, [user]);
  if (isLoadingUser) {
    return (
      <Box p="lg">
        <LoadingOverlay visible={true} />
        <Text>Cargando datos del usuario...</Text>
      </Box>
    );
  }

  if (isError || !user) {
    return (
      <Box p="lg">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          withCloseButton
          onClose={() => router.push("/admin/users-pwa")}
        >
          No se pudieron cargar los datos del usuario o el usuario no existe.
          Error: {error?.message}
        </Alert>
      </Box>
    );
  }
  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Editar Usuario PWA: {user?.name}</Title>
        <Button
          component="a"
          onClick={() => router.push("/admin/users-pwa")}
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
        >
          Volver a la Lista
        </Button>
      </Group>

      {initialFormData && (
        <UserPwaFormComponent
          initialData={initialFormData}
          onSubmit={handleFormSubmit}
          isSaving={isPending}
          onCancel={() => router.push("/admin/users-pwa")}
        />
      )}
    </Box>
  );
}
