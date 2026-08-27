output "vpc_id" {
  description = "VPC ID"
  value = aws_vpc.main.id
}
output "public_subnet_ids" {
  description = "IDs for public subnets"
  value = aws_subnet.public[*].id
}
output "private_subnet_ids" {
  description = "IDs for private subnets"
  value = aws_subnet.private[*].id
}
output "nat_gateway_ip" {
  description = "NAT IP"
  value = aws_eip.nat.public_ip
}