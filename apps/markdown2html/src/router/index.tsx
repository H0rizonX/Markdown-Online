import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import LoadingPage from "../pages/shared/Loading";
import NotFoundPage from "../pages/shared/404";

const HomePage = lazy(() => import("../pages/frontend/Home"));
const Login = lazy(() => import("../pages/frontend/LoginPage"));
const CollabDemo = lazy(() => import("../pages/frontend/CollabDemo"));
const ProfileCenter = lazy(() => import("../pages/frontend/Profile/Index"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<LoadingPage />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/join",
    element: (
      <Suspense fallback={<LoadingPage />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/collab-demo",
    element: (
      <Suspense fallback={<LoadingPage />}>
        <CollabDemo />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoadingPage />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/ProfileCenter",
    element: (
      <Suspense fallback={<LoadingPage />}>
        <ProfileCenter />
      </Suspense>
    ),
  },
  {
    path: "/loading",
    element: <LoadingPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
