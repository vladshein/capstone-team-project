# check is bucket exists
variable "create_bucket" {
  type = bool
  default = true 
}

resource "aws_s3_bucket" "terraform_state" {
  count = var.create_bucket ? 1 : 0
  bucket = var.bucket_name
  
  lifecycle {
    prevent_destroy = true
  }

  tags = merge( {
      Name = var.bucket_name
      Environment = var.environment
    },
    var.tags
  )
}

# versions
resource "aws_s3_bucket_versioning" "terraform_state" {
  count  = var.create_bucket ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

# encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  count  = var.create_bucket ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# block public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  count  = var.create_bucket ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}
