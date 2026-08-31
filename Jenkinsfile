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
                        withCredentials([usernamePassword(credentialsId: 'github-token', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                            sh """
                                git config --global user.email "jenkins@example.com"
                                git config --global user.name "Jenkins CI"
                                
                                git clone -b cloud-infra https://\$GH_TOKEN@github.com/vladshein/capstone-team-project.git tmp_infra
                                cd tmp_infra

                                # Динамічний пошук файлу values.yaml
                                VALUES_FILE\=$(find . -type f -name "values.yaml" | head -n 1)

                                if [ -n "\$VALUES_FILE" ]; then
                                    echo "Found values file at: \$VALUES_FILE"
                                    
                                    # Замінює значення tag: "..." або tag: ... на новий IMAGE_TAG
                                    sed -i -E "s/(tag:\\s*)[\\"']?[^\\"']+[\\"']?/\\1\\"${IMAGE_TAG}\\"/g" "\$VALUES_FILE"
                                    
                                    git add "\$VALUES_FILE"
                                    git commit -m "Update tags to ${IMAGE_TAG} [skip ci]" || echo "No changes to commit"
                                    git push origin cloud-infra
                                else
                                    echo "ERROR: values.yaml was not found in repo"
                                    ls -la
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