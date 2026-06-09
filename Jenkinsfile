pipeline {
    agent any

    // Config de base : dépôt d'images et token
    environment {
        GHCR_IMAGE   = "ghcr.io/miana1407/carburant-api"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        // Récupère le code source
        stage('Checkout') {
            steps { checkout scm }
        }
        // Installe les dépendances npm
        stage('Install dependencies') {
            steps { sh 'npm ci' }
        }
        // Lance les tests
        stage('Tests') {
            steps { sh 'npm test' }
        }
        // Compile TypeScript en JavaScript
        stage('Build TypeScript') {
            steps { sh 'npm run build' }
        }
        // Crée l'image Docker
        stage('Docker Build') {
            steps {
                sh "docker build -t ${GHCR_IMAGE}:${IMAGE_TAG} ."
                sh "docker tag ${GHCR_IMAGE}:${IMAGE_TAG} ${GHCR_IMAGE}:latest"
            }
        }
        // Pousse l'image sur le registry GHCR
        stage('Push vers GHCR') {
            steps {
                sh "echo ${GITHUB_TOKEN_PSW} | docker login ghcr.io -u ${GITHUB_TOKEN_USR} --password-stdin"
                sh "docker push ${GHCR_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${GHCR_IMAGE}:latest"
            }
        }
        // Crée un tag Git et le pousse
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

    // Messages de fin selon le résultat
    post {
        success { echo "Pipeline réussie — image publiée : ${GHCR_IMAGE}:${IMAGE_TAG}" }
        failure { echo "Pipeline échouée" }
    }
}