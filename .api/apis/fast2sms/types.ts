import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type GetDevbulkV21BodyParam = FromSchema<typeof schemas.GetDevbulkV21.body>;
export type GetDevbulkV21MetadataParam = FromSchema<typeof schemas.GetDevbulkV21.metadata>;
export type GetDevbulkV21Response200 = FromSchema<typeof schemas.GetDevbulkV21.response['200']>;
export type GetNewEndpointMetadataParam = FromSchema<typeof schemas.GetNewEndpoint.metadata>;
export type GetNewEndpointResponse200 = FromSchema<typeof schemas.GetNewEndpoint.response['200']>;
