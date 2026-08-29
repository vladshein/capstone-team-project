output "cluster_endpoint" {
  description = "EKS API endpoint"
  value = aws_eks_cluster.this.endpoint
}

output "cluster_ca_certificate" {
  description = "CA data for the cluster"
  value = aws_eks_cluster.this.certificate_authority[0].data
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value = aws_eks_cluster.this.name
}

output "node_role_arn" {
  description = "IAM role ARN for EKS Worker Nodes"
  value = aws_iam_role.node_role.arn
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.oidc.arn
}

output "oidc_provider_url" {
  value = aws_iam_openid_connect_provider.oidc.url
}