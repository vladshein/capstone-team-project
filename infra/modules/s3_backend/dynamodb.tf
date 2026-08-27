resource "aws_dynamodb_table" "terraform_locks" {
  name         = var.dynamodb_table_name
  billing_mode = "PROVISIONED"
  # read/write
  read_capacity  = var.read_capacity
  write_capacity = var.write_capacity
  # hash key for DynamoDB
  hash_key = "LockID"
  # check atribute LockID as type
  attribute {
    name = "LockID"
    type = "S"
  }
  # tags
  tags = merge({
      Name = var.dynamodb_table_name
      Environment = var.environment
    },
    var.tags
  )
}