/** Shown in the shortcuts dialog. Handled in App.vue. */
export const SHORTCUTS: { group: string; items: [keys: string, action: string][] }[] = [
  {
    group: 'Anywhere',
    items: [
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Y  or  Ctrl + Shift + Z', 'Redo'],
      ['Ctrl + S', 'Save the project file'],
      ['Ctrl + E', 'Download all slides'],
      ['P', 'Phone preview'],
      ['?', 'Show these shortcuts'],
    ],
  },
  {
    group: 'On a selected slide (click it first)',
    items: [
      ['J / K', 'Select the next / previous slide'],
      ['Shift + J / Shift + K', 'Move the slide later / earlier'],
      ['Ctrl + D', 'Duplicate the slide'],
      ['Delete / Backspace', 'Delete the slide (Ctrl + Z brings it back)'],
      ['Arrow keys', 'Pan the image'],
      ['Shift + arrow keys', 'Move the text'],
    ],
  },
]

/** Text fields keep the browser's own keys. */
export function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}
