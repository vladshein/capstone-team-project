variable "argo_cd_namespace" {
  description = "The namespace Argo CD."
  type = string
  default = "argocd"
}

variable "repo_url" {
  description = "ArgoCD for monitoring"
  type = string
}

variable "chart_version" {
  description = "Version of the Argo CD helm chart"
  type = string
  default = "7.7.0"
}