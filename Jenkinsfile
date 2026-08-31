pipeline {
    agent none

    environment {
        BACKEND_ECR  = "211125349493.dkr.ecr.us-east-1.amazonaws.com/dev-backend"
        FRONTEND_ECR = "211125349493.dkr.ecr.us-east-1.amazonaws.com/dev-frontend"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Backend Build') {
            agent {
                kubernetes {
                    serviceAccount 'jenkins-admin'
                    yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ['sleep']
    args: ['99d']
    resources:
      requests:
        cpu: "1000m"
        memory: "2Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"
'''
                }
            }
            steps {
                container('kaniko') {
                    sh """
                    mkdir -p /kaniko/.docker
                    /kaniko/executor \
                        --context \${WORKSPACE} \
                        --dockerfile \${WORKSPACE}/backend/Dockerfile.prod \
                        --snapshot-mode=redo \
                        --compressed-caching=false \
                        --destination \${BACKEND_ECR}:\${IMAGE_TAG} \
                        --destination \${BACKEND_ECR}:latest
                    """
                }
            }
        }

        stage('Frontend Build') {
            agent {
                kubernetes {
                    serviceAccount 'jenkins-admin'
                    yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ['sleep']
    args: ['99d']
    resources:
      requests:
        cpu: "1000m"
        memory: "2Gi"
      limits:
        cpu: "2000m"
        memory: "6Gi"
'''
                }
            }
            steps {
                container('kaniko') {
                    sh """
                    mkdir -p /kaniko/.docker
                    /kaniko/executor \
                        --context \${WORKSPACE} \
                        --dockerfile \${WORKSPACE}/frontend/Dockerfile.prod \
                        --target production \
                        --snapshot-mode=redo \
                        --compressed-caching=false \
                        --build-arg VITE_API_URL=/api \
                        --destination \${FRONTEND_ECR}:\${IMAGE_TAG} \
                        --destination \${FRONTEND_ECR}:latest
                    """
                }
            }
        }

        stage('Update GitOps Manifests') {
            agent {
                kubernetes {
                    serviceAccount 'jenkins-admin'
                    yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: git
    image: alpine/git
    command: ['sleep']
    args: ['99d']
'''
                }
            }
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
                                    sed -i "s/tag: .*/tag: \\"${IMAGE_TAG}\\"/g" "\$VALUES_FILE"
                                    git add "\$VALUES_FILE"
                                    git commit -m "Update tags to ${IMAGE_TAG} [skip ci]" || echo "No changes"
                                    git push origin cloud-infra
                                else
                                    echo "File \$VALUES_FILE not found"
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