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
        ECR_REPO = ""
        GITOPS_REPO = "github.com/vladshein/capstone-team-project.git"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build & Push to ECR') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor --context ${workspace}/main/frontend \
                        --dockerfile ${workspace}/main/frontend/Dockerfile \
                        --destination ${ECR_REPO}:${IMAGE_TAG} \
                        --destination ${ECR_REPO}:latest
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
                                git clone -b main https://\$GH_TOKEN@github.com/vladshein/capstone-team-project.git tmp_infra
                                cd tmp_infra
                                FILE_PATH="main/charts/zmina/values.yaml"
                                if [ -f "\$FILE_PATH" ]; then
                                    echo "Update tag to : ${IMAGE_TAG}"
                                    sed -i "s/tag: .*/tag: \\"${IMAGE_TAG}\\"/" "\$FILE_PATH"
                                    git add "\$FILE_PATH"
                                    git commit -m "Update Zmina Fontend image to ${IMAGE_TAG} (Build #${BUILD_NUMBER}) [skip ci]"
                                    git push origin main
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

