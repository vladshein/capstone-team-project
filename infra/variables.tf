variable "github_token" {
  description = "GitHub Personal Access Token for Jenkins"
  type = string
  sensitive = true # hide pass in log (****) 
}

variable "github_user" {
  description = "GitHub User"
  type = string
}

variable "jenkins_admin_pass" {
  description = "Jenkins admin password"
  type = string
  sensitive = true
}

variable "grafana_admin_pass" {
  description = "Grafana admin password"
  type = string
  sensitive = true
}

variable "postgres_pass" {
  description = "Postgres password"
  type = string
  sensitive = true
}