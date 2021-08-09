import * as core from '@actions/core'
import * as github from '@actions/github'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      ref: core.getInput('ref'),
      workflow_id: core.getInput('workflow'),
      workflow_inputs: core.getInput('inputs')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')

    const octokit = github.getOctokit(inputs.token)
    
    // List workflows via API, and handle paginated results
    const workflows: ActionsGetWorkflowResponseData[] =
      await octokit.paginate(octokit.actions.listRepoWorkflows.endpoint.merge({ owner, repo, ref, inputs }))

    // Debug response if ACTIONS_STEP_DEBUG is enabled
    core.debug('### START List Workflows response data')
    core.debug(JSON.stringify(workflows, null, 3))
    core.debug('### END:  List Workflows response data')

    // Locate workflow either by name or id
    const workflow = workflows.find((workflow) => workflow.name === inputs.workflow_id || workflow.id.toString() === inputs.workflow_id)
    if(!workflow) throw new Error(`Unable to find workflow '${inputs.workflow_id}' in ${owner}/${repo}`)
    console.log(`Workflow id is: ${workflow.id}`)

    await octokit.rest.actions.createWorkflowDispatch({
        owner: owner,
        repo: repo,
        workflow_id: workflow.id,
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
