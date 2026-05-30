/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { DiscoveryServerDTO } from './DiscoveryServerDTO';
import type { DiscoveryTagFacetDTO } from './DiscoveryTagFacetDTO';

export type DiscoveryServersResponseDTO = {
    items: Array<DiscoveryServerDTO>;
    tagFacets: Array<DiscoveryTagFacetDTO>;
    nextCursor?: string;
};
