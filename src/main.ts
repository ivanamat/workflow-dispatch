import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import {createAppAuth} from '@octokit/auth-app'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      ref: core.getInput('ref'),
      workflow_id: core.getInput('workflow'),
      workflow_inputs: core.getInput('inputs'),
      appId: core.getInput('appId'),
      privateKey: core.getInput('privateKey'),
      clientId: core.getInput('clientId'),
      clientSecret: core.getInput('clientSecret'),
      installationId: core.getInput('installationId')
    }

    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')

    if (
      inputs.token === '' &&
      (inputs.appId === '' ||
        inputs.privateKey === '' ||
        inputs.clientId === '' ||
        inputs.clientSecret === '' ||
        inputs.installationId === '')
    ) {
      throw new Error(
        'Authorization required!. You must provide a personal access token or Application Credentials. Application Credentials requires appId, privateKey, clientId, clientSecret, and installation.'
      )
    }

    let token = ''

    if (inputs.token) {
      token = inputs.token
    }

    if (
      inputs.appId &&
      inputs.privateKey &&
      inputs.clientId &&
      inputs.clientSecret &&
      inputs.installationId
    ) {
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: inputs.appId,
          privateKey: inputs.privateKey
          //privateKey: process.env.PRIVATE_KEY,
          // optional: this will make appOctokit authenticate as app (JWT)
          //           or installation (access token), depending on the request URL
          //installationId: 123,
        }
      })

      const response = await appOctokit.request('GET /app/installations')
      core.debug(`APP Installations RESPONSE: ${inspect(response)}`)

      const data = response.data
      core.debug(`APP Installations DATA: ${inspect(data)}`)

      let installationId = Number(0)

      while (data) {
        if (Number(data[0].app_id) == Number(inputs.appId)) {
          installationId = Number(data[0].id)
          break
        }
      }

      core.debug(`APP Installation ID: ${installationId}`)

      throw new Error(`EXIT!`)

      const auth = createAppAuth({
        appId: inputs.appId,
        privateKey: inputs.privateKey,
        clientId: inputs.clientId,
        clientSecret: inputs.clientSecret
      })

      // Retrieve installation access token
      const installationAuthentication = await auth({
        type: 'installation',
        installationId: installationId
      })

      token = installationAuthentication.token
    }

    if (token === '') {
      throw new Error(
        'Invalid credentials! You must provide a valid personal access token or valid Application Credentials. Application Credentials requires appId, privateKey, clientId, clientSecret, and installation. Please, review your defined credentials.'
      )
    }

    const octokit = github.getOctokit(token)

    const installations = await octokit.request('GET /app/installations')
    core.debug(`Installations: ${inspect(installations)}`)

    await octokit.rest.actions.createWorkflowDispatch({
      owner: owner,
      repo: repo,
      workflow_id: inputs.workflow_id,
      ref: inputs.ref,
      inputs: JSON.parse(inputs.workflow_inputs)
    })
  } catch (error) {
    core.debug(inspect(error))
    if (error.status == 404) {
      core.setFailed(
        'Repository not found, OR token has insufficient permissions.'
      )
    } else {
      core.setFailed(error.message)
    }
  }
}

run()
