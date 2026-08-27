terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # aws s3 mb s3://capstone-team-project --region us-east-1

  backend "s3" {
    bucket = "capstone-team-project"
    key = "capstone-team-project/terraform.tfstate"
    region = "us-east-1"
    use_lockfile = true
    encrypt = true
  }
}
