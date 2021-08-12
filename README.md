# Workflow Dispatch
[![CI](https://github.com/ivanamat/workflow-dispatch/workflows/CI/badge.svg)](https://github.com/ivanamat/workflow-dispatch/actions?query=workflow%3ACI)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Repository%20Dispatch-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=)](https://github.com/marketplace/actions/repository-dispatch)


A GitHub action to create a repository dispatch event.

## Usage

```yml
      - name: Workflow Dispatch
        uses: ivanamat/workflow-dispatch@v1
        with:
          token: ${{ secrets.REPO_ACCESS_TOKEN }}
          repository: the-iron-bank-of-braavos/poc-actions
          workflow: nested-workflow.yml
          ref: refs/heads/feature/workflow-dispatch
          inputs: "{\"name\":\"Command Line User\", \"home\":\"CLI\" }"
```

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `token` | (**required**) A `repo` scoped GitHub [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). See [token](#token) for further details. | |
| `repository` | The full name of the repository to send the dispatch. | `github.repository` (current repository) |
| `ref` | Branch, tag or commit. | `github.ref` ( Current branch ) |
| `workflow` | (**required**) A custom workflow id or file name. | |
| `client-payload` | JSON payload with params. | `{}` |

#### `token`

This action creates [`repository_dispatch`](https://developer.github.com/v3/repos/#create-a-repository-dispatch-event) events.
The default `GITHUB_TOKEN` does not have scopes to do this so a `repo` scoped [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) created on a user with `write` access to the target repository is required.
If you will be dispatching to a public repository then you can use the more limited `public_repo` scope.

## Example

Here is an example setting all of the input parameters.

```yml
      - name: Workflow Dispatch
        uses: ivanamat/workflow-dispatch@v1
        with:
          token: ${{ secrets.REPO_ACCESS_TOKEN }}
          repository: the-iron-bank-of-braavos/poc-actions
          workflow: nested-workflow.yml
          ref: refs/heads/feature/workflow-dispatch
          inputs: "{\"name\":\"Command Line User\", \"home\":\"CLI\" }"
```

Here is an example `on: repository_dispatch` workflow to receive the event.
Note that repository dispatch events will only trigger a workflow run if the workflow is committed to the default branch.

```yml
name: NestedWorkflow

on:
  workflow_dispatch:
    inputs:
      name:
        description: 'Person to greet'
        required: true
        default: 'Mona the Octocat'
      home:
        description: 'location'
        required: false
        default: 'The Octoverse'

jobs: 
  nested-workflow-job:
    runs-on: ubuntu-latest
    name: Nested Workflow Job
    if: ${{ github.event.inputs.name != '' }}
    steps:
    - run: |
        echo "Hello ${{ github.event.inputs.name }} in ${{ github.event.inputs.home }} from workflow dispatch"
  


```

## License

[MIT](LICENSE)
