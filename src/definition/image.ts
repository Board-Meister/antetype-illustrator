import { TypeDefinition } from '@boardmeister/antetype-core';

const image: () => TypeDefinition = () => ({
  image: {
    timeout: 'number',
    fit: 'string',
    overcolor: {
      fill: 'string',
    },
    outline: {
      thickness: 'number',
      fill: 'string',
    },
    align: {
      vertical: 'string',
      horizontal: 'string',
    },
    fitTo: 'string',
    src: 'string',
  }
})

export default image;
