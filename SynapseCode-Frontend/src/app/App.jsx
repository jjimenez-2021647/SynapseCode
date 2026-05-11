import { useEffect } from "react";
import { AppRoutes } from "./router/AppRoutes.jsx";
import { Toaster } from "react-hot-toast"
import { useAuthStore } from "../features/auth/store/authStore.js";
import { ScrollRestoration } from "./router/ScrollRestoration.jsx";

export const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: "1rem",
            borderRadius: "8px"
          }
        }}
      />
      <ScrollRestoration />
      <AppRoutes />
    </>
  )
}
