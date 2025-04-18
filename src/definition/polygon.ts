import { TypeDefinition } from '@boardmeister/antetype-core';

const polygon:  () => TypeDefinition = () => ({
  polygon: {
    steps: [
      {
        means: 'string',
        args: {
          x: 'number',
          y: 'number',
          cp1x: 'number',
          cp1y: 'number',
          cp2x: 'number',
          cp2y: 'number',
          thickness: 'number',
          fill: 'string',
          lineJoin: 'string',
          miterLimit: 'number',
        }
      }
    ],
    size: {
      negative: {
        x: 'number',
        y: 'number',
      },
      positive: {
        x: 'number',
        y: 'number',
      }
    }
  }
})

export default polygon;
