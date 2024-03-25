import findApi from './rules/find-api';
import findSchema from './rules/find-schema';

export = {
  rules: {
    'find-schema': findSchema,
    'find-api': findApi
  }
};
