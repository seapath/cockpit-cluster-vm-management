/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Dropdown,
  MenuToggle,
  DropdownItem,
  DropdownList,
} from '@patternfly/react-core';

class VMImporter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      vmList: [],
      selectedVM: '',
      isDropdownOpen: false,
      isLoading: false,
      isImported: null,
      progressImport: '',
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen && !prevProps.isOpen) {
      this.fetchLocalVMs();
    }
  }

  fetchLocalVMs = () => {
    Promise.all([
      cockpit.spawn(["virsh", "list", "--all", "--name"], { superuser: "try" }),
      cockpit.spawn(["vm-mgr", "list"], { superuser: "try" }),
    ])
      .then(([localOutput, clusterOutput]) => {
        const localVMs = localOutput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const clusterVMs = clusterOutput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const vms = localVMs.filter(vm => !clusterVMs.includes(vm));
        this.setState({ vmList: vms });
      })
      .catch((error) => {
        console.error("Error fetching VMs:", error);
        this.setState({ vmList: [] });
      });
  };

  handleDropdownToggle = () => {
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  };

  handleDropdownSelect = (vm) => {
    this.setState({ selectedVM: vm, isDropdownOpen: false });
  };

  handleConfirm = () => {
    const { selectedVM } = this.state;
    const { refreshVMList } = this.props;

    this.setState({ isLoading: true, isImported: null, progressImport: '' });
    cockpit.spawn(["vm-mgr", "add-to-cluster", "-p", "--name", selectedVM], { superuser: "try" })
      .stream((output) => {
        this.setState({ progressImport: output.trim() });
      })
      .then(() => {
        this.setState({ isImported: true });
        refreshVMList();
      })
      .catch((error) => {
        this.setState({ isImported: false });
        console.error("Error importing VM:", error);
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  render() {
    const { isOpen, onClose } = this.props;
    const { vmList, selectedVM, isDropdownOpen, isLoading, isImported, progressImport } = this.state;

    return (
      <Modal
        title="Import VM to Cluster"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={onClose}
        actions={[
          <Button key="applyButton" variant="primary" onClick={this.handleConfirm} isDisabled={!selectedVM || isLoading}>
            Apply
          </Button>,
          <Button key="cancelButton" variant="link" onClick={onClose}>
            Cancel
          </Button>,
        ]}
      >
        {isImported !== null && (
          <Alert
            variant={isImported ? 'success' : 'danger'}
            title={isImported ? 'VM successfully imported!' : 'Failed to import VM.'}
            style={{ marginBottom: '20px' }}
          />
        )}

        <Dropdown
          isOpen={isDropdownOpen}
          onSelect={this.handleDropdownSelect}
          onOpenChange={isOpen => this.setState({ isDropdownOpen: isOpen })}
          toggle={toggleRef => (
            <MenuToggle ref={toggleRef} onClick={this.handleDropdownToggle} isExpanded={isDropdownOpen}>
              {selectedVM || "Select a VM"}
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            {vmList.map((vm, index) => (
              <DropdownItem key={index} onClick={() => this.handleDropdownSelect(vm)}>
                {vm}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>

        <br />
        {isLoading && <div style={{ textAlign: "center" }}>{progressImport}</div>}
      </Modal>
    );
  }
}

VMImporter.propTypes = {
  refreshVMList: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default VMImporter;
