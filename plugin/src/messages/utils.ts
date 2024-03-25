import { TSESTree } from '@typescript-eslint/utils';
import {
  ReportDescriptor,
  RuleMetaData
} from '@typescript-eslint/utils/dist/ts-eslint';
import { JsonMessage } from './index';

export function createMeta(description: string): RuleMetaData<'json'> {
  return {
    docs: {
      description,
      recommended: 'warn'
    },
    messages: {
      json: '{{ message }}'
    },
    type: 'suggestion',
    schema: []
  };
}

export function createReport(
  node: TSESTree.Node,
  message: JsonMessage
): ReportDescriptor<'json'> {
  return {
    // Use the 'json' message in the meta object.
    messageId: 'json',
    data: {
      message
    },
    node
  };
}
