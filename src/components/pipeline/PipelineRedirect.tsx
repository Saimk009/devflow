import { Navigate, useParams } from "react-router-dom"

export function PipelineRedirect() {
  const { id } = useParams()

  return <Navigate replace to={`/pipelines/${id ?? ""}`} />
}
