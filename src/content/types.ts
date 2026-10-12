// A lesson is a short sequence of steps. Each step either explains something
// or asks the learner to do something, then shows why.

export type Visual =
  | { kind: 'fraction'; parts: number; shaded?: number } // a bar split into `parts`; slider shades n of them
  | { kind: 'line'; intercept: number; slope?: number; point?: [number, number] } // y = m·x + b, slider sets m
  | { kind: 'angle'; a?: number; b: number } // slider sets angle A, B is fixed, C = 180 − A − B
  | { kind: 'balance'; left: string; right: string } // a static balance scale picture
  | { kind: 'media'; src: string; alt: string } // MP4 or GIF, e.g. exported from Canva

export type Step =
  | { type: 'explain'; title?: string; body: string; visual?: Visual }
  | {
      type: 'choice'
      prompt: string
      visual?: Visual
      options: string[]
      answer: number // index into options
      explanation: string
      hint?: string
    }
  | {
      type: 'number'
      prompt: string
      visual?: Visual
      answer: number
      tolerance?: number
      unit?: string
      explanation: string
      hint?: string
    }
  | {
      type: 'slider'
      prompt: string
      visual: Visual
      min: number
      max: number
      step: number
      start: number
      answer: number
      explanation: string
      hint?: string
    }

export type Lesson = { id: string; title: string; steps: Step[] }

export type Course = {
  id: string
  title: string
  branch: string
  level: 'Foundational' | 'Intermediate' | 'Advanced'
  blurb: string
  color: string
  lessons: Lesson[]
  // Planned lesson titles shown on the course path before they are written.
  upcoming?: string[]
}
