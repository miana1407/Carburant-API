pipeline {
    agent any

    environment {
        GHCR_IMAGE   = "ghcr.io/miana1407/carburant-api"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install dependencies') {
            steps { sh 'npm ci' }
        }
        stage('Tests') {
            steps { sh 'npm test' }
        }
        stage('Build TypeScript') {
            steps { sh 'npm run build' }
        }
        stage('Docker Build') {
            steps {
                sh "docker build -t ${GHCR_IMAGE}:${IMAGE_TAG} ."
                sh "docker tag ${GHCR_IMAGE}:${IMAGE_TAG} ${GHCR_IMAGE}:latest"
            }
        }
        stage('Push vers GHCR') {
            steps {
                sh "echo ${GITHUB_TOKEN_PSW} | docker login ghcr.io -u ${GITHUB_TOKEN_USR} --password-stdin"
                sh "docker push ${GHCR_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${GHCR_IMAGE}:latest"
            }
        }
        stage('Tag GitHub') {
            steps {
                sh """
                    git config user.email "ci@jenkins"
                    git config user.name "Jenkins"
                    git tag -a v${IMAGE_TAG} -m "Build ${IMAGE_TAG}"
                    git push https://${GITHUB_TOKEN_PSW}@github.com/miana1407/Carburant-API.git v${IMAGE_TAG}
                """
            }
        }
    }

    post {
        success { echo "Pipeline réussie — image publiée : ${GHCR_IMAGE}:${IMAGE_TAG}" }
        failure { echo "Pipeline échouée" }
    }
}