import { TypeDefinition } from '@boardmeister/antetype-core';

const text:  () => TypeDefinition = () => ({
  text: {
    value: 'string',
    align: {
      vertical: 'string',
      horizontal: 'string',
    },
    columns: {
      amount: 'number',
      gap: 'number',
    },
    font: {
      style: 'string',
      family: 'string',
      weight: 'string',
      size: 'string',
      stretch: 'string',
      variant: 'string',
      height: 'string',
    },
    spacing: 'number',
    textBaseline: 'string',
    wrap: 'boolean',
    lineHeight: 'number',
    color: 'string',
    outline: {
      fill: 'string',
      thickness: 'number',
      lineJoin: 'string',
      miterLimit: 'number',
      transY: 'number',
      lines: [['string', 'number']],
    },
  }
});

export default text;