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
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  Radio,
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
      isLiveMigrationEnabled: true,
      isPinnedHostEnabled: false,
      isPreferredHostEnabled: false,
      locationHostname: '',
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

  handleCheckboxChange = () => {
    this.setState({ isLiveMigrationEnabled: !this.state.isLiveMigrationEnabled });
  };

  handleLocationPreferenceChange = (e) => {
    const id = e.target.id;
    this.setState({
      isPinnedHostEnabled: id === 'import-pinned-host',
      isPreferredHostEnabled: id === 'import-preferred-host',
    });
  };

  handleLocationHostnameChange = (e) => {
    this.setState({ locationHostname: e.target.value });
  };

  handleConfirm = () => {
    const { selectedVM } = this.state;
    const { refreshVMList } = this.props;

    const args = [];
    if (this.state.isLiveMigrationEnabled) {
      args.push('--enable-live-migration');
      args.push('--migration-user');
      args.push('libvirtadmin');
    }

    if (this.state.isPinnedHostEnabled) {
      args.push('--pinned-host');
      args.push(this.state.locationHostname);
    } else if (this.state.isPreferredHostEnabled) {
      args.push('--preferred-host');
      args.push(this.state.locationHostname);
    }

    this.setState({ isLoading: true, isImported: null, progressImport: '' });
    cockpit.spawn(["vm-mgr", "add-to-cluster", "-p", "--name", selectedVM, ...args], { superuser: "try" })
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

        <Form style={{ marginTop: '20px' }}>
          <Checkbox
            id="import-enable-live-migration"
            label="Enable live migration"
            isChecked={this.state.isLiveMigrationEnabled}
            onChange={this.handleCheckboxChange}
          />
          <FormGroup role="radiogroup" label="Location preference" isInline>
            <Radio
              label="None"
              id="import-none"
              onChange={this.handleLocationPreferenceChange}
              isChecked={!this.state.isPinnedHostEnabled && !this.state.isPreferredHostEnabled}
            />
            <Radio
              label="Preferred host"
              id="import-preferred-host"
              onChange={this.handleLocationPreferenceChange}
              isChecked={this.state.isPreferredHostEnabled}
            />
            <Radio
              label="Pinned host"
              id="import-pinned-host"
              onChange={this.handleLocationPreferenceChange}
              isChecked={this.state.isPinnedHostEnabled}
            />
          </FormGroup>
          {(this.state.isPinnedHostEnabled || this.state.isPreferredHostEnabled) && (
            <FormGroup label="Hostname" fieldId="import-hostname">
              <TextInput
                id="import-hostname"
                value={this.state.locationHostname}
                onChange={this.handleLocationHostnameChange}
              />
            </FormGroup>
          )}
        </Form>

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
