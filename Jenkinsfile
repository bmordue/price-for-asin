try {
    node {
        wrap([$class: 'TimestamperBuildWrapper']) {
            stage 'Checkout source'
            scm checkout

            stage 'Install dependencies'
            sh 'npm install'

            stage 'Test'
            sh 'npm test'

            stage 'Coverage'
            sh 'npm run-script coverage'
        }
    }
} catch (exc) {
    echo "Caught: ${exc}"

    String recipient = 'benmordue@gmail.com'

    mail subject: "${env.JOB_NAME} (${env.BUILD_NUMBER}) failed",
            body: "It appears that ${env.BUILD_URL} is failing, somebody should do something about that",
              to: recipient,
         replyTo: recipient,
            from: 'noreply@ci.blackbox.lan'
}
