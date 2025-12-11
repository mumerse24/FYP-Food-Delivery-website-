import { Navigate } from "react-router-dom"

interface Props {
  children: JSX.Element
}

const AdminRoute = ({ children }: Props) => {
  const token = localStorage.getItem("adminToken")

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default AdminRoute
