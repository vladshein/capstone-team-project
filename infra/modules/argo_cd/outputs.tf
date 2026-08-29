output "argo_cd_namespace" {
  value = var.argo_cd_namespace
}
output "agrocd_port_forward" {
  description = "port forward for argocd"
  value       = "kubectl port-forward svc/argocd-server 8081:443 -n ${var.argo_cd_namespace}"
}
