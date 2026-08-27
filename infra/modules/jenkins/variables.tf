variable "environment" {
  description = "Environment name"
  type = string
}
variable "cluster_name" {
  description = "EKS cluster name"
  type = string
}
variable "ecr_repository" {
  description = "ECR endpoint"
  type = string
}
variable "oidc_provider_arn" { 
  description="Provider arn"
  type = string 
}
variable "oidc_provider_url" { 
  description="Provider url" 
  type = string 
}
variable "jenkins_namespace" {
  description = "Kuber namespace for Jenkins"
  type = string
  default = "jenkins"
}
variable "chart_version" {
  description = "Version of the Jenkins Helm chart"
  type = string
  default = "4.6.1"
}
variable "storage_class" {
  description = "StorageClass for PersistentVolume"
  type = string
}
variable "kubeconfig" {
  description = "path to kuberconfig file"
  type = string
}
variable "jenkins_admin_pass" {
  description = "admin password for jenkins"
  type = string
  sensitive = true
}
variable "github_token" {
  description = "PAT github token"
  type = string
  sensitive = true
}