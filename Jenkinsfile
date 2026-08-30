pipeline {
    agent {
        kubernetes {
            serviceAccount 'jenkins-admin'
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ['sleep']
    args: ['99d']
  - name: git
    image: alpine/git
    command: ['sleep']
    args: ['99d']
"""
        }
    }

    environment {
        BACKEND_ECR  = "211125349493.dkr.ecr.us-east-1.amazonaws.com/dev-backend"
        FRONTEND_ECR = "211125349493.dkr.ecr.us-east-1.amazonaws.com/dev-frontend"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build & Push Images') {
            parallel {
                stage('Backend Build') {
                    steps {
                        container('kaniko') {
                            sh """
                            mkdir -p /kaniko/.docker
                            /kaniko/executor \
                                --context \${WORKSPACE} \
                                --dockerfile \${WORKSPACE}/backend/Dockerfile.prod \
                                --destination \${BACKEND_ECR}:\${IMAGE_TAG} \
                                --destination \${BACKEND_ECR}:latest
                            """
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        container('kaniko') {
                            sh """
                            mkdir -p /kaniko/.docker
                            /kaniko/executor \
                                --context \${WORKSPACE} \
                                --dockerfile \${WORKSPACE}/frontend/Dockerfile.prod \
                                --target production \
                                --destination \${FRONTEND_ECR}:\${IMAGE_TAG} \
                                --destination \${FRONTEND_ECR}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Update GitOps Manifests') {
            steps {
                container('git') {
                    script {
                        withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
                            sh """
                                git config --global user.email "jenkins@example.com"
                                git config --global user.name "Jenkins CI"
                                git clone -b cloud-infra https://\$GH_TOKEN@github.com/vladshein/capstone-team-project.git tmp_infra
                                cd tmp_infra

                                VALUES_FILE="charts/zmina/values.yaml"
                                if [ -f "\$VALUES_FILE" ]; then
                                    echo "Updating image tags to ${IMAGE_TAG}..."
                                    sed -i "s/tag: .*/tag: \\"${IMAGE_TAG}\\"/g" "\$VALUES_FILE"
                                    
                                    git add "\$VALUES_FILE"
                                    git commit -m "Update Backend & Frontend image tags to ${IMAGE_TAG} [skip ci]" || echo "No changes to commit"
                                    git push origin cloud-infra
                                else
                                    echo "error: file \$VALUES_FILE not found in GitOps repo"
                                    exit 1
                                fi
                            """
                        }
                    }
                }
            }
        }
    }
}