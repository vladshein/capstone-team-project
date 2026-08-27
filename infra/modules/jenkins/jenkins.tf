resource "kubernetes_namespace_v1" "jenkins" {
  metadata {
    name = "jenkins"
  }
}

resource "kubernetes_service_account_v1" "jenkins" {
  metadata {
    name = "jenkins-admin"
    namespace = "jenkins"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.jenkins_ecr_role.arn
    }
  }
  depends_on = [kubernetes_namespace_v1.jenkins]
}

# IAM for Jenkins
resource "aws_iam_role" "jenkins_ecr_role" {
  name = "${var.environment}-jenkins-ecr-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "${replace(var.oidc_provider_url, "https://", "")}:sub": "system:serviceaccount:jenkins:jenkins-admin"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_ecr_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
  role = aws_iam_role.jenkins_ecr_role.name
}

# Jenkins
resource "helm_release" "jenkins" {
  name = "jenkins"
  repository = "https://charts.jenkins.io"
  chart = "jenkins"
  namespace = kubernetes_namespace_v1.jenkins.metadata[0].name
  create_namespace = false
  force_update = true
  recreate_pods = true
  cleanup_on_fail = true
  replace = true 
  timeout = 900
  wait = true

  values = [
    templatefile("${path.module}/values.yaml", {
      jenkins_admin_pass = var.jenkins_admin_pass
      GITHUB_TOKEN = var.github_token
    })
  ]

  set = [
    {
      name = "controller.serviceAccount.create"
      value = "false" # we created SA, above, via kubernetes_service_account_v1
    },
    {
      name = "controller.serviceAccount.name"
      value = kubernetes_service_account_v1.jenkins.metadata[0].name
    }
  ]

  depends_on = [kubernetes_service_account_v1.jenkins]
}

data "kubernetes_service_v1" "jenkins_svc" {
  metadata {
    name = "jenkins" 
    namespace = "jenkins"
  }
  depends_on = [helm_release.jenkins]
}