variable "environment" {
  description = "kubernetes enviroment"
  type = string
  default = "dev"
}

variable "cluster_name" {
  description = "kubernetes name"
  type = string
  default = "dev-final-project-kuber"
}

variable "cluster_version" {
  description = "version of kubernetes"
  type = string
  default = "1.35"
}

variable "vpc_id" {
  description = "id of vpc"
  type = string
}

variable "private_subnet_ids" {
  description = "List of ID (private subnet)"
  type = list(string)
}

variable "node_group_name" {
  description = "name of group node"
  type = string
  default = "main"
}

variable "node_group_instance_types" {
  description = "type of instances for nodegroup"
  type = list(string)
  default = ["t3.medium"]
}

variable "node_group_desired_size" {
  description = "kubernetes desire size"
  type = number
  default = 2
}

variable "node_group_min_size" {
  description = "kubernetes minimal node group size"
  type = number
  default = 1
}

variable "node_group_max_size" {
  description = "kubernetes minimal node group size"
  type = number
  default = 3
}