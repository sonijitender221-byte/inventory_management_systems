import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Spinner from "./Spinner";

export default function ProtectedRoute({ roles }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <Spinner full />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}