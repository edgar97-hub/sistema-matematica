// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [
//   ...compat.extends("next/core-web-vitals", "next/typescript"),
// ];

// export default eslintConfig;

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Este objeto es donde definirás tus propias reglas personalizadas
    rules: {
      // 1. Deshabilitar 'react-hooks/exhaustive-deps' (Advertencia)
      //    'off' significa que la regla está completamente deshabilitada.
      //    'warn' la deja como advertencia (no detiene el build).
      //    'error' la convierte en un error (detiene el build).
      //    ⚠️ RECUERDA: La recomendación es arreglar la dependencia, no deshabilitar la regla.
      "react-hooks/exhaustive-deps": "off",

      // 2. Cambiar 'no-explicit-any' de error a advertencia (para 'any')
      //    Por defecto, 'next/typescript' probablemente la tiene como 'error'.
      //    ⚠️ RECUERDA: La recomendación es tipar correctamente, no usar 'any'.
      "@typescript-eslint/no-explicit-any": "warn",

      // 3. Cambiar 'no-unused-vars' de error a advertencia (para variables no usadas)
      //    Similarmente, 'next/core-web-vitals' o 'next/typescript' la tienen como 'error'.
      //    ⚠️ RECUERDA: La recomendación es eliminar el código no utilizado.
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "warn", // Asegúrate de cubrir también la regla de ESLint base por si acaso
      // (aunque @typescript-eslint/no-unused-vars suele manejar esto para TS)

      // 4. Cambiar 'prefer-const' de error a advertencia (para variables que pueden ser const)
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
