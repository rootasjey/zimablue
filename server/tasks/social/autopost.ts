import { defineTask } from 'nitropack/runtime/task'
import { runSocialAutopost } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost',
    description: 'Attempt one queued social autopost per active platform when enabled by config'
  },
  async run() {
    const result = await runSocialAutopost()
    return { result }
  }
})