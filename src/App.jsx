import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MemberLayout from "./components/MemberLayout";
import AdminLayout from "./components/AdminLayout";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import DailyQuiz from "./pages/DailyQuiz";
import Alma from "./pages/Alma";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute><MemberLayout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/quiz-del-dia" element={<DailyQuiz />} />
          <Route path="/alma" element={<Alma />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/productos" element={<AdminProducts />} />
          <Route path="/admin/categorias" element={<AdminCategories />} />
          <Route path="/admin/usuarias" element={<AdminUsers />} />
          <Route path="/admin/resenas" element={<AdminReviews />} />
          <Route path="/admin/ajustes" element={<AdminSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
