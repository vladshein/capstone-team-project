variable "bucket_name" {
  description = "name of S3 bucket"
  type = string
}
variable "tags" {
  description = "tags for resources"
  type = map(string)
  default = {}
}
variable "environment" {
  description = "enviroment name"
  type = string
}
variable "dynamodb_table_name" {
  description = "name of DynamoDB table for state blocking"
  type = string
}
variable "read_capacity" {
  description = "read capacity for DynamoDB"
  type = number
  default = 1
}
variable "write_capacity" {
  description = "write capacity for DynamoDB"
  type = number
  default = 1
}