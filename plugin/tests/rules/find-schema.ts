import { ESLintUtils } from '@typescript-eslint/utils';
import findSchema from '../../src/rules/find-schema';
import { EntityMessage } from '../../src/messages';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

ruleTester.run('find-schema', findSchema, {
  valid: [
    {
      code: 'class User {}'
    }
  ],
  invalid: [
    {
      code: `
      @Entity()
      class User {
        @PrimaryGeneratedColumn()
        id: number;
      }
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new EntityMessage('User')
          }
        }
      ]
    },
    {
      code: `
      @ViewEntity(expression='SELECT * FROM user')
      class User {
        @PrimaryGeneratedColumn()
        id: number;
      }
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new EntityMessage('User')
          }
        }
      ]
    },
    {
      code: `
      @ChildEntity()
      class User {
        @PrimaryGeneratedColumn()
        id: number;
      }
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new EntityMessage('User')
          }
        }
      ]
    }
  ]
});
