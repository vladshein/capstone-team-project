variable "repository_name" {
  description = "name of repo for ECR"
  type = string
  default = "dev-final-project"
}
variable "environment" {
  description = "enviroment"
  type = string
  default = "dev"
}
variable "image_tag_mutability" {
  description = "tag config"
  type = string
  default = "MUTABLE"
}
variable "scan_on_push" {
  description = "autoscan"
  type = bool
  default = true
}