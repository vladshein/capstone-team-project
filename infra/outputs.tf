output "s3_bucket_name" {
  description = "Name of S3 bucket"
  value = module.s3_backend.s3_bucket_id
}
output "dynamodb_table_name" {
  description = "Name of DynamoDB"
  value = module.s3_backend.dynamodb_table_name
}
output "vpc_id" {
  description = "ID of VPC"
  value = module.vpc.vpc_id
}
output "public_subnet_ids" {
  description = "ID of public subnets"
  value = module.vpc.public_subnet_ids
}
output "private_subnet_ids" {
  description = "ID of private subnets"
  value = module.vpc.private_subnet_ids
}
output "ecr_repository_url" {
  description = "URL of ECR repo"
  value = module.ecr.repository_url
}
output "eks_cluster_name" {
  description = "kubernetes name"
  value = module.eks.cluster_name
}
output "eks_cluster_endpoint" {
  description = "kubernetes endpoint"
  value = module.eks.cluster_endpoint
}
output "eks_cluster_certificate_authority" {
  description = "kubernetes certificate"
  value = module.eks.cluster_ca_certificate
  sensitive = true
}
output "jenkins_release" {
  description = ""
  value = module.jenkins.jenkins_release_name
}
output "jenkins_namespace" {
  description = ""
  value = module.jenkins.jenkins_namespace
}
output "rds_address" {
  description = ""
  value = module.rds.db_endpoint
}
