variable "github_token" {
  description = "GitHub Personal Access Token for Jenkins"
  type = string
  sensitive = true # hide pass in log (****) 
}

variable "db_name" {
  description = "The name of the database to create in RDS"
  type = string
}

variable "username" {
  description = "RDS username"
  type = string
}

variable "password" {
  description = "RDS password"
  type = string
  sensitive = true
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