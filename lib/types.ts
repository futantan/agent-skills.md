import { client } from '@/lib/api/orpc'
import type { InferClientOutputs } from '@orpc/client'

type Outputs = InferClientOutputs<typeof client>

export type Skill = Outputs['skills']['list'][number]