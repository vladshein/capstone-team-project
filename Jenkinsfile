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
        // 1. Вказуємо ECR URI до вашого backend або frontend
        ECR_REPO = "211125349493.dkr.ecr.us-east-1.amazonaws.com/dev-backend"
        GITOPS_REPO = "github.com/vladshein/capstone-team-project.git"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build & Push to ECR') {
            steps {
                container('kaniko') {
                    sh """
                    # Створюємо AWS ECR credentials для Kaniko без додаткових утиліт
                    mkdir -p /kaniko/.docker
                    
                    # Запускаємо збірку з коректними змінними WORKSPACE (у верхньому регістрі)
                    /kaniko/executor \
                        --context \${WORKSPACE} \
                        --dockerfile \${WORKSPACE}/Dockerfile \
                        --destination \${ECR_REPO}:\${IMAGE_TAG} \
                        --destination \${ECR_REPO}:latest
                    """
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
                                
                                FILE_PATH="charts/backend/values.yaml"
                                if [ -f "\$FILE_PATH" ]; then
                                    echo "Update tag to : ${IMAGE_TAG}"
                                    sed -i "s/tag: .*/tag: \\"${IMAGE_TAG}\\"/" "\$FILE_PATH"
                                    git add "\$FILE_PATH"
                                    git commit -m "Update image tag to ${IMAGE_TAG} [skip ci]" || echo "No changes to commit"
                                    git push origin cloud-infra
                                else
                                    echo "error: file \$FILE_PATH not found"
                                    ls -R
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