/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Direction, Query } from "@elastic/eui";
import { SMPolicy } from "../../models/interfaces";
import {
  IndexService,
  ManagedIndexService,
  PolicyService,
  RollupService,
  TransformService,
  NotificationService,
  SnapshotManagementService,
} from "../services";

export interface BrowserServices {
  indexService: IndexService;
  managedIndexService: ManagedIndexService;
  policyService: PolicyService;
  rollupService: RollupService;
  transformService: TransformService;
  notificationService: NotificationService;
  snapshotManagementService: SnapshotManagementService;
}

export interface SMPoliciesQueryParams {
  from: number;
  size: number;
  sortField: keyof SMPolicy;
  sortOrder: Direction;
}

interface ArgsWithQuery {
  query: Query;
  queryText: string;
  error: null;
}
interface ArgsWithError {
  query: null;
  queryText: string;
  error: Error;
}
export type OnSearchChangeArgs = ArgsWithQuery | ArgsWithError;

export interface Toast {
  id?: string;
  title?: string;
  iconType?: string;
  color: string;
  text?: JSX.Element;
}

export interface RestoreError {
  reason?: string,
  type?: string
}

export interface LatestActivities {
  activityType: "Creation" | "Deletion";
  status?: string;
  snapshot?: string;
  start_time?: number;
  end_time?: number;
  info?: {
    message?: string;
    cause?: string;
  };
}

export enum RESTORE_OPTIONS {
  restore_specific_indices = "restore_specific_indices",
  restore_all_indices = "restore_all_indices",
  do_not_rename = "do_not_rename",
  add_prefix = "add_prefix",
  rename_indices = "rename_indices",
  restore_aliases = "restore_aliases",
  include_global_state = "include_global_state",
  ignore_unavailable = "ignore_unavailable",
  partial = "partial",
  customize_index_settings = "customize_index_settings",
  ignore_index_settings = "ignore_index_settings",
}
