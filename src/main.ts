import * as core from '@actions/core'
import * as github from '@actions/github'
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
        '[Error]: Authorization is required!. Yoy need to provide a Personal Access Token or Application Credentials. Application Credentials require: appId, privateKey, clientId, clientSecret and installationId'
      )
    }

    const auth = createAppAuth({
      appId: inputs.appId,
      privateKey: inputs.privateKey,
      clientId: inputs.clientId,
      clientSecret: inputs.clientSecret
    })

    // Retrieve installation access token
    const installationAuthentication = await auth({
      type: 'installation',
      installationId: inputs.installationId
    })

    const token = installationAuthentication.token

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
