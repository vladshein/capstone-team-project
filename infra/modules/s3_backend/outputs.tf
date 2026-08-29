output "dynamodb_table_arn" {
  value = aws_dynamodb_table.terraform_locks.arn
  description = "ARN of DynamoDB"
}
output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value = one(aws_s3_bucket.terraform_state[*].arn)
}
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value = var.create_bucket ? one(aws_s3_bucket.terraform_state[*].id) : var.bucket_name
}
output "dynamodb_table_name" {
  description = "Name of DynamoDB table"
  value       = aws_dynamodb_table.terraform_locks.name
}
