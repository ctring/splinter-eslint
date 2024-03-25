import { ESLintUtils } from '@typescript-eslint/utils';
import findApi from '../../src/rules/find-api';
import { Attribute, MethodMessage } from '../../src/messages';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'test-tsconfig.json',
    tsconfigRootDir: __dirname + '/..'
  }
});

ruleTester.run('find-api', findApi, {
  valid: [
    {
      code: 'repository.noFind()'
    }
  ],
  invalid: [
    {
      code: `
      class Repository<T> {}
      class User {}
      class Wrapper {
        repository: Repository<User>;
        constructor() {
          this.repository = new Repository<User>();
        }
      }
      new Wrapper().repository.findOneBy({
        name: "John",
        age: 18,
        "address": {
          "street": "Main Street",
          "city": "New York"  
        },
        ...{
          "occupation": "Developer"
        }
      });
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findOneBy',
              'read',
              'repository',
              ['Repository<User>'],
              [
                new Attribute('address', 13, 8, 13, 17),
                new Attribute('age', 12, 8, 12, 11),
                new Attribute('name', 11, 8, 11, 12),
                new Attribute('occupation', 18, 10, 18, 22)
              ]
            )
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class User extends Repository<Person> {
        doSave() {
          return this.save();
        }
      }
      let user = new User();
      user.increment([{firstname: "John"}, {lastname: "Doe"}], "age", 1);
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'save',
              'write',
              'this',
              ['this', 'Repository<Person>'],
              []
            )
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'increment',
              'write',
              'user',
              ['User', 'Repository<Person>'],
              [
                new Attribute('firstname', 9, 23, 9, 32),
                new Attribute('lastname', 9, 44, 9, 52)
              ]
            )
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class User {}
      let repository = new Repository<User>();
      repository.count({
        where: {
          name: "John",
        }
      });
      repository.findAndCount({
        where: [{
          firstname: "John",
        }, {
          lastname: "Doe",
        }]
      });
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'count',
              'read',
              'repository',
              ['Repository<User>'],
              [new Attribute('name', 7, 10, 7, 14)]
            )
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findAndCount',
              'read',
              'repository',
              ['Repository<User>'],
              [
                new Attribute('firstname', 12, 10, 12, 19),
                new Attribute('lastname', 14, 10, 14, 18)
              ]
            )
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class User {}
      new Repository<User>().findOne({
        select: ["id"],
        order: {
          age: "DESC",
        },
        take: 10,
      });
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findOne',
              'read',
              'new Repository<User>()',
              ['Repository<User>'],
              []
            )
          }
        }
      ]
    },
    {
      code: `
      class Service {
        @Transaction
        txnA() {
        }

        @LazyTransaction()
        async txnB() {
        }
      }
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage('txnA', 'transaction', '', ['any'], [])
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage('txnB', 'transaction', '', ['any'], [])
          }
        }
      ]
    },
    {
      code: `
      one.two.three(a, b, c).findOne({});
      one
        .two()
        .three()({
          a, b, c
        }).findOne({});
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findOne',
              'read',
              'three(a, b, c)',
              ['any'],
              []
            )
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findOne',
              'read',
              'three()({a, b, c})',
              ['any'],
              []
            )
          }
        }
      ]
    }
  ]
});
