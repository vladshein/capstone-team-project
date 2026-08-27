
resource "aws_ecr_repository" "main" {
  name = "${var.environment}-${var.repository_name}"
  image_tag_mutability = var.image_tag_mutability
  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }
  tags = {
    Name = "${var.environment}-${var.repository_name}"
    Environment = var.environment
  }
}