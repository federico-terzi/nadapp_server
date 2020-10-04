import { Ability, InferSubjects } from '@casl/ability';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'authorize' | 'deauthorize';

interface Patient {
  id: number
}

interface Doctor {
  id: number
}

export type SubjectTypes = Patient | "Patient" | Doctor | "Doctor"
export type Subjects = InferSubjects<SubjectTypes>;

export type NadAbility = Ability<[Actions, Subjects]>