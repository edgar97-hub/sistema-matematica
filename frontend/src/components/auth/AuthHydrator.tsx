"use client";

import { useEffect } from "react";
import { useAuthStore, UserPwa } from "../../store/auth.store"; // Ajusta la ruta
import { authService } from "../../lib/services/auth.service"; // Necesitas un servicio de autenticación

function AuthHydrator() {
  const {
    token,
    setUser,
    logout,
    isLoading,
    startCreditPolling,
    stopCreditPolling,
  } = useAuthStore();
  console.log("isLoading", isLoading, token);
  useEffect(() => {
    // Esta función se ejecuta solo una vez al montar el componente
    const syncUser = async () => {
      // Si hay un token persistido en el store...
      if (token) {
        try {
          // ...hacemos una petición para obtener los datos frescos del usuario.
          const freshUser: UserPwa = await authService.getMe(token);
          console.log("freshUser", freshUser);
          // Actualizamos el store con los datos del backend.
          setUser(freshUser, token);
          startCreditPolling(); // Start polling after successful authentication
        } catch (error) {
          // Si el token es inválido o ha expirado, el backend devolverá un error 401.
          // En ese caso, limpiamos el estado de autenticación.
          console.error(
            "Fallo al sincronizar usuario, probablemente el token es inválido:",
            error
          );
          logout();
        }
      } else {
        // Si no hay token, nos aseguramos de que el estado de carga sea 'false'.
        useAuthStore.getState().setLoading(false);
      }
    };

    // Solo sincronizamos si el estado inicial está cargando
    if (token) {
      syncUser();
    }

    // Cleanup: Stop polling when component unmounts
    return () => {
      stopCreditPolling();
    };
  }, [
    token,
    setUser,
    logout,
    isLoading,
    startCreditPolling,
    stopCreditPolling,
  ]); // El efecto depende de estas funciones y estado

  // Este componente no renderiza nada, solo ejecuta la lógica de sincronización.
  return null;
}

export default AuthHydrator;
