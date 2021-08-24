import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import {createAppAuth} from '@octokit/auth-app'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    // Get inputs values
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      ref: core.getInput('ref'),
      workflow_id: core.getInput('workflow'),
      workflow_inputs: core.getInput('inputs'),
      organization: core.getInput('organization'),
      appId: core.getInput('appId'),
      privateKey: core.getInput('privateKey'),
      clientId: core.getInput('clientId'),
      clientSecret: core.getInput('clientSecret')
    }

    // Debug inputs
    core.debug(`Inputs: ${inspect(inputs)}`)

    // Define owner and repo
    const [owner, repo] = inputs.repository.split('/')

    /*
     * Check credentials.
     * Must be defined a Personal Access Token or App Credentials
     */
    if (
      inputs.token === '' &&
      (inputs.organization === '' ||
        inputs.appId === '' ||
        inputs.privateKey === '' ||
        inputs.clientId === '' ||
        inputs.clientSecret === '')
    ) {
      throw new Error(
        'Authorization required!. You must provide a personal access token or Application Credentials. Application Credentials requires appId, privateKey, clientId, clientSecret, and installation.'
      )
    }

    // Define empty token
    let token = ''

    // If inputs.token is not empty, set token value with inputs.token
    if (inputs.token) {
      token = inputs.token
    }

    /*
     * If App Credentials are configured,
     * retrieve the installation access token
     */
    if (
      inputs.appId &&
      inputs.privateKey &&
      inputs.clientId &&
      inputs.clientSecret
    ) {
      // Create octokit instance as app
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: inputs.appId,
          privateKey: inputs.privateKey
        }
      })

      // Retrieve app installations list
      const response = await appOctokit.request('GET /app/installations')
      const data = response.data

      let installationId = Number(0)

      // Find app installationId by organization
      /*
      while (data) {
        if (Number(data[0].organization) == Number(inputs.organization)) {
          installationId = Number(data[0].id)
          break
        }
      }
      */
      
      for (let installation in data) {
        if (installation.account.login == inputs.organization) {
            installationId = installation.id;
            break;
        }
      }

      // Create app authentication
      const auth = createAppAuth({
        appId: inputs.appId,
        privateKey: inputs.privateKey,
        clientId: inputs.clientId,
        clientSecret: inputs.clientSecret
      })

      // Authenticate as app installation and retrieve access token
      const installationAuthentication = await auth({
        type: 'installation',
        installationId: installationId
      })

      // Set access token
      token = installationAuthentication.token
    }

    // Throw error of invalid credentials if token is empty ( or not found ).
    if (token === '') {
      throw new Error(
        'Invalid credentials! You must provide a valid personal access token or valid Application Credentials. Application Credentials requires appId, privateKey, clientId, clientSecret, and installation. Please, review your defined credentials.'
      )
    }

    // Create octokit instance as app installation
    const octokit = github.getOctokit(token)

    // Dispatch workflow
    await octokit.rest.actions.createWorkflowDispatch({
      owner: owner,
      repo: repo,
      workflow_id: inputs.workflow_id,
      ref: inputs.ref,
      inputs: JSON.parse(inputs.workflow_inputs)
    })

    // Only for debug purposes
    core.debug(`All successfully done!`)
  } catch (error) {
    core.debug(inspect(error))

    /*
     * Throw error if repository not found,
     * OR token has insufficient permissions
     */
    if (error.status == 404) {
      core.setFailed(
        'Repository not found, OR token has insufficient permissions.'
      )
    } else {
      // Throw uncontrolled errors
      core.setFailed(error.message)
    }
  }
}

// Execute run function
run()
