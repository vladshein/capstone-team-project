variable "name" {
  description = "name of instance or cluster"
  type = string
  default = "capstone"
}
variable "engine" {
  description = "Engine for standard RDS (postgres, mysql)"
  type = string
  default = "postgres"
}
variable "engine_cluster" {
  description = "Engine for Aurora cluster"
  type = string
  default = "aurora-postgresql"
}
variable "aurora_replica_count" {
  description = "Number of reader replicas in Aurora"
  type = number
  default = 1
}
variable "aurora_instance_count" {
  description = "the number of database instances—comprising one writer and multiple reader nodes—within a single cluster"
  type = number
  default = 1 # 1 primary + 1 replica
}
variable "engine_version" {
  description = "Engine version for standard RDS"
  type = string
  default = "17.2"
}
variable "instance_class" {
  description = "Instance class (db.t3.micro, db.t3.medium, etc.)"
  type = string
  default = "db.t3.micro"
}
variable "allocated_storage" {
  description = "Disk size in GB (Standard RDS only)"
  type = number
  default = 20
}
variable "db_name" {
  description = "Name of the database to be created"
  type = string
  default = "tododb"
}
variable "username" {
  description = "Master username"
  type = string
}
variable "password" {
  description = "Master password (sensitive)"
  type = string
  sensitive = true
}
variable "vpc_id" {
  description = "VPC ID"
  type = string
}
variable "subnet_private_ids" {
  description = "Private subnet IDs"
  type = list(string)
}
variable "subnet_public_ids" {
  description = "Public subnet IDs"
  type = list(string)
}
variable "publicly_accessible" {
  description = "Whether the DB is accessible from the internet"
  type = bool
  default = false
}
variable "multi_az" {
  description = "Multi-AZ for standard RDS"
  type = bool
  default = false
}
variable "parameters" {
  description = "refers to the specific database engine settings used to fine-tune databases performance and behavior"
  type = map(string)
  default = {}
}
variable "use_aurora" {
  description = "(true) -> Aurora cluster, `false` -> standard RDS"
  type = bool
  default = false
}
variable "backup_retention_period" {
  description = "Number of days to retain backup"
  type = string
  default = ""
}
variable "tags" {
  description = "Tags for all module resources"
  type = map(string)
  default = {}
}
variable "parameter_group_family_aurora" {
  description = "Family for Aurora parameter group"
  type = string
  default = "aurora-postgresql17"
}
variable "engine_version_cluster" {
  description = "ngine version for Aurora"
  type = string
  default = "17.2"
}
variable "parameter_group_family_rds" {
  description = "Family for standard RDS parameter group"
  type = string
  default = "postgres17"
}
variable "port" {
  description = "database listening port"
  type = string
  default = "5432"
}
variable "monitoring_interval" {
  description = "Enhanced Monitoring in seconds"
  type        = number
  default     = 60
}
variable "performance_insights_enabled" {
  description = "enable performance insights"
  type        = bool
  default     = true
}
variable "performance_insights_retention_period" {
  description = "performance insights in days"
  type        = number
  default     = 7
}
