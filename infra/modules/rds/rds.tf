# Standard RDS Instance
resource "aws_db_instance" "this" {
  count = var.use_aurora ? 0 : 1  
  identifier = var.name
  engine = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class
  allocated_storage = var.allocated_storage
  db_name = var.db_name
  username = var.username
  password = var.password
  
  db_subnet_group_name = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  
  multi_az = var.multi_az
  publicly_accessible = var.publicly_accessible
  # publicly_accessible = true
  backup_retention_period = var.backup_retention_period
  
  parameter_group_name = aws_db_parameter_group.this[0].name

  skip_final_snapshot     = true
  deletion_protection     = false
  final_snapshot_identifier = false

  # monitoring
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  performance_insights_enabled = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null

  # logs
  enabled_cloudwatch_logs_exports = var.engine == "postgres" ? ["postgresql"] : ["error", "general", "slow_query"]

  tags = var.tags
}

# Standard parameter group
resource "aws_db_parameter_group" "this" {
  count = var.use_aurora ? 0 : 1
  name = "${var.name}-rds-params"
  family = var.parameter_group_family_rds
  description = "Standard RDS PG for ${var.name}"

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name = parameter.key
      value = parameter.value
      apply_method = "pending-reboot"
    }
  }

  tags = var.tags
}

# aim role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = (!var.use_aurora && var.monitoring_interval > 0) ? 1 : 0
  name = "${var.name}-rds-monitoring-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  tags = var.tags
}

# aim policy
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = (!var.use_aurora && var.monitoring_interval > 0) ? 1 : 0
  role = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}