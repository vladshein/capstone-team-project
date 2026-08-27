variable "environment" {
  description = "enviroment"
  type = string
  default = "dev"
}
variable "vpc_cidr" {
  description = "CIDR for VPC"
  type = string
  default = "10.0.0.0/16"
}
variable "availability_zones" {
  description = "available zones for subnets"
  type = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
variable "public_subnet_cidrs" {
  description = "CIDR for public"
  type = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}
variable "private_subnet_cidrs" {
  description = "CIDR for private"
  type = list(string)
  default = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}