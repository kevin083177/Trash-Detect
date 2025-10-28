import { createHashRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Home } from "../page/Home";
import { Users } from "../page/Users";
import { FeedbackPage } from "../page/Feedback";
import { ProductPage } from "../page/Product";
import { Themes } from "../page/Theme";
import { Game } from "../page/Game";
import { Login } from "../page/Login";
import { Question } from "../page/Question";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { VoucherPage } from "../page/Voucher";
import { LevelPage } from "../page/Level";
import { MapsPage } from "../page/Maps";

export const router = createHashRouter([
  { path: "login", element: <Login /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "product",
        element: (
          <ProtectedRoute>
            <ProductPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "theme",
        element: (
          <ProtectedRoute>
            <Themes />
          </ProtectedRoute>
        ),
      },
      {
        path: "feedback",
        element: (
          <ProtectedRoute>
            <FeedbackPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "game",
        element: (
          <ProtectedRoute>
            <Game />
          </ProtectedRoute>
        ),
      },
      {
        path: "questions/:chapter_name",
        element: (
          <ProtectedRoute>
            <Question />
          </ProtectedRoute>
        )
      },
      {
        path: "levels",
        element: (
          <ProtectedRoute>
            <LevelPage />
          </ProtectedRoute>
        )
      },
      {
        path: "voucher",
        element: (
          <ProtectedRoute>
            <VoucherPage />
          </ProtectedRoute>
        )
      },
      {
        path: "maps",
        element: (
          <ProtectedRoute>
            <MapsPage />
          </ProtectedRoute>
        )
      }
    ],
  },
]);
