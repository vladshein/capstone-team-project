output "prometheus_release_name" {
  description = "Name of helm release for prometeus"
  value = helm_release.prometheus.name
}
output "grafana_namespace" {
  description = "kubernetes namespace for Grafana"
  value = helm_release.prometheus.namespace
}
output "grafana_port_forward" {
  description = "port forward grafana"
  value       = "kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring"
}

