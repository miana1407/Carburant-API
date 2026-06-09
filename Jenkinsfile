pipeline {
    agent any

    // Variables globales : on définit où envoyer l'image Docker et comment s'authentifier
    environment {
        GHCR_IMAGE   = "ghcr.io/miana1407/carburant-api"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        // Clône le code du repo GitHub sur le serveur Jenkins
        stage('Checkout') {
            steps { checkout scm }
        }
        // Télécharge toutes les bibliothèques npm nécessaires 
        stage('Install dependencies') {
            steps { sh 'npm ci' }
        }
        // Exécute la suite de tests pour vérifier que tout fonctionne 
        stage('Tests') {
            steps { sh 'npm test' }
        }
        // Compile le code TypeScript en JavaScript que les serveurs peuvent exécuter
        stage('Build TypeScript') {
            steps { sh 'npm run build' }
        }
        // Construit une image Docker avec le code compilé
        stage('Docker Build') {
            steps {
                sh "docker build -t ${GHCR_IMAGE}:${IMAGE_TAG} ."
                sh "docker tag ${GHCR_IMAGE}:${IMAGE_TAG} ${GHCR_IMAGE}:latest"
            }
        }
        // Se connecte à GitHub Container Registry et envoie l'image Docker
        stage('Push vers GHCR') {
            steps {
                sh "echo ${GITHUB_TOKEN_PSW} | docker login ghcr.io -u ${GITHUB_TOKEN_USR} --password-stdin"
                sh "docker push ${GHCR_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${GHCR_IMAGE}:latest"
            }
        }
        // Crée un tag dans Git pour marquer cette version et l'envoie à GitHub
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

    // Affiche un message de statut à la fin 
    post {
        success { echo "Pipeline réussie — image publiée : ${GHCR_IMAGE}:${IMAGE_TAG}" }
        failure { echo "Pipeline échouée" }
    }
}