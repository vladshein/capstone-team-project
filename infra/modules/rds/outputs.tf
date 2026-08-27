output "db_endpoint" {
  value = var.use_aurora ? aws_rds_cluster.aurora[0].endpoint : aws_db_instance.this[0].endpoint
}
output "db_port" {
  value = var.port
}
output "monitoring_role_arn" {
  description = "ARN role for Enhanced Monitoring"
  value = var.monitoring_interval > 0 ? (
    var.use_aurora ? aws_iam_role.aurora_enhanced_monitoring[0].arn : aws_iam_role.rds_enhanced_monitoring[0].arn
  ) : null
}