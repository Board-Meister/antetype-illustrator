import { TypeDefinition } from '@boardmeister/antetype-core';

const group: () => TypeDefinition = () => ({
  group: {
    clip: 'boolean',
    interaction: 'string',
    direction: 'string',
    wrap: 'boolean',
    gap: {
      vertical: 'number',
      horizontal: 'number',
    }
  }
})

export default group;
