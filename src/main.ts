import * as core from '@actions/core'
import * as github from '@actions/github'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      workflow_id: core.getInput('workflow_id'),
      ref: core.getInput('ref'),
      inputs: core.getInput('inputs')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')

    const octokit = github.getOctokit(inputs.token)

    /*
    await octokit.rest.repos.createDispatchEvent({
      owner: owner,
      repo: repo,
      event_type: inputs.eventType,
      client_payload: JSON.parse(inputs.clientPayload),
      inputs: JSON.parse(inputs.inputs)
    })
    */
    
    await octokit.rest.actions.createWorkflowDispatch({
        owner: owner,
        repo: repo,
        workflow_id: inputs.workflow_id,
        ref: inputs.ref,
        inputs: JSON.parse(inputs.inputs)
    });
    
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
