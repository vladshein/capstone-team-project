output "jenkins_release_name" {
  description = "jenkins helm release"
  value = helm_release.jenkins.name
}
output "jenkins_namespace" {
  description = "eks namespace for jenkins"
  value = helm_release.jenkins.namespace
}
output "jenkins_url" {
  description = "URL of the Jenkins service"
  value = format("http://%s", data.kubernetes_service_v1.jenkins_svc.status[0].load_balancer[0].ingress[0].hostname)
}
output "port_forward_jenkins" {
  description = "port forward for jenkins"
  value = "kubectl port-forward svc/jenkins 8080:8080 -n jenkins"
}
