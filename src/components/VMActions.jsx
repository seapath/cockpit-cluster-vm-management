/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Spinner } from '@patternfly/react-core';
import VMSnapshot from './VMSnapshot';
import SelectionModal from './selectionModal';

class VMActions extends React.Component {
  state = {
    isDisabled: true,
    isLoading: false,
    isSnapshotCreatorOpen: false,
    isSnapshotApplyOpen: false,
    snapshotList: [],
  };

  componentDidUpdate(prevProps) {
    if (prevProps.selectedVM !== this.props.selectedVM) {
      this.setState({ isDisabled: this.props.selectedVM ? false : true });
    }
  }

  handleActionVmMgr = (action, args = []) => {
    const { selectedVM, refreshVMList } = this.props;
    if (selectedVM) {
      this.setState({ isLoading: true }, () => {
        cockpit.spawn(["vm-mgr", action, "-n", selectedVM.name, ...args], { superuser: "try" })
          .then(() => {
            refreshVMList();
            this.setState({ isLoading: false });
          })
          .catch(error => {
            console.error("Error executing VM action:", error);
            this.setState({ isLoading: false });
          });
      });
    }
  };

  handleActionCrm = (action, args = []) => {
    const { selectedVM, refreshVMList } = this.props;
    if (selectedVM) {
      this.setState({ isLoading: true }, () => {
        cockpit.spawn(["crm", "resource", action, selectedVM.name, ...args], { superuser: "try" })
          .then(() => {
            refreshVMList();
            this.setState({ isLoading: false });
          })
          .catch(error => {
            console.error("Error executing VM action:", error);
            this.setState({ isLoading: false });
          });
      });
    }
  };


// Snapshot creation

  openVMSnapshot = () => {
    this.setState({ isSnapshotCreatorOpen: true });
  };

  closeVMSnapshot = () => {
    this.setState({ isSnapshotCreatorOpen: false });
  };

  handleSnapshotConfirm = (snapshotName) => {
    this.setState({ isSnapshotCreatorOpen: false }, () => {
      this.handleActionVmMgr('create_snapshot', ['--snap_name', snapshotName]);
    });
  };

// Rollback VM from snapshot

  openVMSnapshotApply = async () => {
    const snapshotList = await this.getVMSnapshotList();
    this.setState({
      isSnapshotApplyOpen: true,
      snapshotList,
    });
  };

  closeVMSnapshotApply = () => {
    this.setState({ isSnapshotApplyOpen: false });
  };

  handleSnapshotApplyConfirm = (snapshotName) => {
    this.setState({ isSnapshotApplyOpen: false }, () => {
      this.handleActionVmMgr('rollback', ['--snap_name', snapshotName]);
    });
  };

  getVMSnapshotList = async () => {
    const { selectedVM } = this.props;

    try {
      const output = await cockpit.spawn(["vm-mgr", "list_snapshots", "-n", selectedVM.name], { superuser: "try" });
      let snapshotList = output.trim().replace(/[\[\]']+/g, '').split(", ");
      return snapshotList;
    } catch (error) {
      console.error("Error executing VM action:", error);
      return [];
    }
  };

  render() {
    const { isDisabled, isLoading, isSnapshotCreatorOpen, isSnapshotApplyOpen, snapshotList } = this.state;
    return (
      <React.Fragment>
        <br />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="primary"
              onClick={() => this.handleActionVmMgr('start')}
            >
              Start
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('stop')}
            >
              Stop
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('stop', ['--force'])}
              isDanger
            >
              Force Stop
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('enable')}
            >
              Enable
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('disable')}
            >
              Disable
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('disable', ['--force'])}
              isDanger
            >
              Force Disable
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionCrm('restart')}
            >
              Restart
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="danger"
              onClick={() => this.handleActionVmMgr('remove')}
            >
              Remove
            </Button>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={this.openVMSnapshot}
            >
              Snapshot
            </Button>
            <Button
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={this.openVMSnapshotApply}
            >
              Apply Snapshot
            </Button>
          </div>
          {isLoading && (
            <div style={{ marginTop: '20px' }}>
              <Spinner size="xl" />
            </div>
          )}
        </div>
        <VMSnapshot
          isOpen={isSnapshotCreatorOpen}
          onConfirm={this.handleSnapshotConfirm}
          onCancel={this.closeVMSnapshot}
        />
        <SelectionModal
          title="Apply Snapshot"
          isOpen={isSnapshotApplyOpen}
          options={snapshotList}
          onConfirm={this.handleSnapshotApplyConfirm}
          onCancel={this.closeVMSnapshotApply}
        />
      </React.Fragment>
    );
  }
}

export default VMActions;
