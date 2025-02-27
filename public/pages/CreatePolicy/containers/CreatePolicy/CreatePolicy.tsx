/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, Component, Fragment } from "react";
import { EuiSpacer, EuiTitle, EuiFlexGroup, EuiFlexItem, EuiButton, EuiButtonEmpty, EuiCallOut, EuiLink, EuiIcon } from "@elastic/eui";
import queryString from "query-string";
import { RouteComponentProps } from "react-router-dom";
import { DEFAULT_POLICY } from "../../utils/constants";
import DefinePolicy from "../../components/DefinePolicy";
import ConfigurePolicy from "../../components/ConfigurePolicy";
import { Policy } from "../../../../../models/interfaces";
import { PolicyService } from "../../../../services";
import { BREADCRUMBS, DOCUMENTATION_URL, ROUTES } from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/helpers";
import { CoreServicesContext } from "../../../../components/core_services";

interface CreatePolicyProps extends RouteComponentProps {
  isEdit: boolean;
  policyService: PolicyService;
}

interface CreatePolicyState {
  policyId: string;
  policyIdError: string;
  jsonString: string;
  policySeqNo: number | null;
  policyPrimaryTerm: number | null;
  submitError: string;
  isSubmitting: boolean;
  hasSubmitted: boolean;
}

export default class CreatePolicy extends Component<CreatePolicyProps, CreatePolicyState> {
  static contextType = CoreServicesContext;
  constructor(props: CreatePolicyProps) {
    super(props);

    this.state = {
      policySeqNo: null,
      policyPrimaryTerm: null,
      policyId: "",
      policyIdError: "",
      submitError: "",
      jsonString: "",
      isSubmitting: false,
      hasSubmitted: false,
    };
  }

  componentDidMount = async (): Promise<void> => {
    this.context.chrome.setBreadcrumbs([BREADCRUMBS.INDEX_MANAGEMENT, BREADCRUMBS.INDEX_POLICIES]);
    if (this.props.isEdit) {
      const { id } = queryString.parse(this.props.location.search);
      if (typeof id === "string" && !!id) {
        this.context.chrome.setBreadcrumbs([
          BREADCRUMBS.INDEX_MANAGEMENT,
          BREADCRUMBS.INDEX_POLICIES,
          BREADCRUMBS.EDIT_POLICY,
          { text: id },
        ]);
        await this.getPolicyToEdit(id);
      } else {
        this.context.notifications.toasts.addDanger(`Invalid policy id: ${id}`);
        this.props.history.push(ROUTES.INDEX_POLICIES);
      }
    } else {
      this.context.chrome.setBreadcrumbs([BREADCRUMBS.INDEX_MANAGEMENT, BREADCRUMBS.INDEX_POLICIES, BREADCRUMBS.CREATE_POLICY]);
      this.setState({ jsonString: DEFAULT_POLICY });
    }
  };

  getPolicyToEdit = async (policyId: string): Promise<void> => {
    try {
      const { policyService } = this.props;
      const response = await policyService.getPolicy(policyId);
      if (response.ok) {
        this.setState({
          policySeqNo: response.response.seqNo,
          policyPrimaryTerm: response.response.primaryTerm,
          policyId: response.response.id,
          jsonString: JSON.stringify({ policy: response.response.policy }, null, 4),
        });
      } else {
        this.context.notifications.toasts.addDanger(`Could not load the policy: ${response.error}`);
        this.props.history.push(ROUTES.INDEX_POLICIES);
      }
    } catch (err) {
      this.context.notifications.toasts.addDanger(getErrorMessage(err, "Could not load the policy"));
      this.props.history.push(ROUTES.INDEX_POLICIES);
    }
  };

  onCreate = async (policyId: string, policy: { policy: Policy }): Promise<void> => {
    const { policyService } = this.props;
    try {
      const response = await policyService.putPolicy(policy, policyId);
      if (response.ok) {
        this.context.notifications.toasts.addSuccess(`Created policy: ${response.response._id}`);
        this.props.history.push(ROUTES.INDEX_POLICIES);
      } else {
        this.setState({ submitError: response.error });
      }
    } catch (err) {
      this.setState({ submitError: getErrorMessage(err, "There was a problem creating the policy") });
    }
  };

  onUpdate = async (policyId: string, policy: { policy: Policy }): Promise<void> => {
    try {
      const { policyService } = this.props;
      const { policyPrimaryTerm, policySeqNo } = this.state;
      if (policySeqNo == null || policyPrimaryTerm == null) {
        this.context.notifications.toasts.addDanger("Could not update policy without seqNo and primaryTerm");
        return;
      }
      const response = await policyService.putPolicy(policy, policyId, policySeqNo, policyPrimaryTerm);
      if (response.ok) {
        this.context.notifications.toasts.addSuccess(`Updated policy: ${response.response._id}`);
        this.props.history.push(ROUTES.INDEX_POLICIES);
      } else {
        this.setState({ submitError: response.error });
      }
    } catch (err) {
      this.setState({ submitError: getErrorMessage(err, "There was a problem updating the policy") });
    }
  };

  onCancel = (): void => {
    if (this.props.isEdit) this.props.history.goBack();
    else this.props.history.push(ROUTES.INDEX_POLICIES);
  };

  onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { hasSubmitted } = this.state;
    const policyId = e.target.value;
    if (hasSubmitted) this.setState({ policyId, policyIdError: policyId ? "" : "Required" });
    else this.setState({ policyId });
  };

  onChangeJSON = (value: string): void => {
    this.setState({ jsonString: value });
  };

  onAutoIndent = (): void => {
    try {
      const parsedJSON = JSON.parse(this.state.jsonString);
      this.setState({ jsonString: JSON.stringify(parsedJSON, null, 4) });
    } catch (err) {
      // do nothing
    }
  };

  onSubmit = async (): Promise<void> => {
    const { isEdit } = this.props;
    const { policyId, jsonString } = this.state;
    this.setState({ submitError: "", isSubmitting: true, hasSubmitted: true });
    try {
      if (!policyId) {
        this.setState({ policyIdError: "Required" });
      } else {
        const policy = JSON.parse(jsonString);
        if (isEdit) await this.onUpdate(policyId, policy);
        else await this.onCreate(policyId, policy);
      }
    } catch (err) {
      this.context.notifications.toasts.addDanger("Invalid Policy JSON");
      console.error(err);
    }

    this.setState({ isSubmitting: false });
  };

  renderEditCallOut = (): React.ReactNode | null => {
    const { isEdit } = this.props;
    if (!isEdit) return null;

    return (
      <Fragment>
        <EuiCallOut
          title="Edits to the policy are not automatically applied to indices that are already being managed by this policy."
          iconType="questionInCircle"
        >
          <p>
            This ensures that any update to a policy doesn't harm indices that are running under an older version of the policy. To carry
            over your edits to these indices, please use the "Change Policy" under "Managed Indices" to reapply the policy after submitting
            your edits.{" "}
            <EuiLink href={DOCUMENTATION_URL} target="_blank" rel="noopener noreferrer">
              Learn more <EuiIcon type="popout" size="s" />
            </EuiLink>
          </p>
        </EuiCallOut>
        <EuiSpacer />
      </Fragment>
    );
  };

  render() {
    const { isEdit } = this.props;
    const { policyId, policyIdError, jsonString, submitError, isSubmitting } = this.state;

    let hasJSONError = false;
    try {
      JSON.parse(jsonString);
    } catch (err) {
      hasJSONError = true;
    }

    return (
      <div style={{ padding: "25px 50px" }}>
        <EuiTitle size="l">
          <h1>{isEdit ? "Edit" : "Create"} policy</h1>
        </EuiTitle>
        <EuiSpacer />
        {this.renderEditCallOut()}
        <ConfigurePolicy policyId={policyId} policyIdError={policyIdError} isEdit={isEdit} onChange={this.onChange} />
        <EuiSpacer />
        <DefinePolicy jsonString={jsonString} onChange={this.onChangeJSON} onAutoIndent={this.onAutoIndent} hasJSONError={hasJSONError} />
        <EuiSpacer />
        {submitError && (
          <EuiCallOut title="Sorry, there was an error" color="danger" iconType="alert">
            <p>{submitError}</p>
          </EuiCallOut>
        )}
        <EuiSpacer />
        <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={this.onCancel} data-test-subj="createPolicyCancelButton">
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={this.onSubmit} isLoading={isSubmitting} data-test-subj="createPolicyCreateButton">
              {isEdit ? "Update" : "Create"}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}
