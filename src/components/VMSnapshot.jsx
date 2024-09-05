/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalVariant, Button, Form, FormGroup, TextInput } from '@patternfly/react-core';

class VMSnapshot extends React.Component {
  state = {
    snapshotName: '',
  };

  handleSnapshotNameChange = (e) => {
    this.setState({ snapshotName: e.target.value });
  };

  handleConfirm = () => {
    const { snapshotName } = this.state;
    this.props.onConfirm(snapshotName);
  };

  handleCancel = () => {
    this.setState({ snapshotName: '' });
    this.props.onCancel();
  };

  render() {
    const { isOpen } = this.props;
    const { snapshotName } = this.state;

    return (
      <Modal
        title="Create Snapshot"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={this.handleCancel}
        actions={[
          <Button key="confirm" variant="primary" onClick={this.handleConfirm}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={this.handleCancel}>
            Cancel
          </Button>
        ]}
      >
        <Form>
          <FormGroup label="Snapshot Name" isRequired fieldId="snapshot-name">
            <TextInput
              isRequired
              type="text"
              id="snapshot-name"
              name="snapshotName"
              value={snapshotName}
              onChange={this.handleSnapshotNameChange}
            />
          </FormGroup>
        </Form>
      </Modal>
    );
  }
}

VMSnapshot.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
}

export default VMSnapshot;
