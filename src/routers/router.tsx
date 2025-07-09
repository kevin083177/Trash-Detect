import { createHashRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Home } from "../page/Home";
import { Users } from "../page/Users";
import { Feedback } from "../page/Feedback";
import { Product } from "../page/Product";
import { Themes } from "../page/Theme";
import { Game } from "../page/Game";
import { Login } from "../page/Login";
import { GameQuestion } from "../page/Game_Question";
import { ProtectedRoute } from "../components/ProtectedRoute";

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
        path: "products/:theme_name",
        element: (
          <ProtectedRoute>
            <Product />
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
            <Feedback />
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
            <GameQuestion />
          </ProtectedRoute>
        )
      }
    
    ],
  },
]);
