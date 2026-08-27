resource "helm_release" "prometheus" {
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "56.6.2"
  timeout          = 600

  values = [
    templatefile("${path.module}/values.yaml", {
      grafana_admin_pass = var.grafana_admin_pass
    })
  ]
}
